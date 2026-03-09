import { Storage } from "@plasmohq/storage"
import { createClient } from "@supabase/supabase-js"
import { generateObject, embed } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

import type { CaptureResult } from "~utils/extractor"

// ---------------------------------------------------------------------------
// Supabase client — uses @plasmohq/storage as the auth storage adapter so
// that sessions (including refresh tokens) are persisted across service-worker
// restarts and auto-refreshed by the Supabase SDK.
// ---------------------------------------------------------------------------

const storage = new Storage()

const plasmoStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return (await storage.get<string>(key)) ?? null
  },
  async setItem(key: string, value: string): Promise<void> {
    await storage.set(key, value)
  },
  async removeItem(key: string): Promise<void> {
    await storage.remove(key)
  },
}

let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.PLASMO_PUBLIC_SUPABASE_URL || "",
      process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: {
          storage: plasmoStorageAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    )
  }
  return supabaseInstance
}

async function getUserId(): Promise<string> {
  const supabase = getSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error("Not signed in. Click 'Sign In' in the Nexus extension popup.")
  }
  return user.id
}

function getModels(activeProvider: string, keys: { openai: string; gemini: string; anthropic: string }) {
  let model: any
  let embeddingModel: any

  if (activeProvider === "gemini") {
    if (!keys.gemini) throw new Error("No Gemini key configured in Nexus Settings.")
    const google = createGoogleGenerativeAI({ apiKey: keys.gemini })
    model = google("gemini-2.5-flash")
    embeddingModel = google.embedding("gemini-embedding-001")
  } else if (activeProvider === "anthropic") {
    if (!keys.anthropic) throw new Error("No Anthropic key configured in Nexus Settings.")
    model = createAnthropic({ apiKey: keys.anthropic })("claude-3-5-sonnet-20240620")
    
    // Anthropic has no embedding model — fallback to OpenAI or Gemini
    if (keys.openai) {
      embeddingModel = createOpenAI({ apiKey: keys.openai }).embedding("text-embedding-3-small")
    } else if (keys.gemini) {
      embeddingModel = createGoogleGenerativeAI({ apiKey: keys.gemini }).embedding("gemini-embedding-001")
    } else {
      throw new Error("Anthropic doesn't provide embeddings. Please also add an OpenAI or Gemini key.")
    }
  } else {
    if (!keys.openai) throw new Error("No OpenAI key configured in Nexus Settings.")
    const openai = createOpenAI({ apiKey: keys.openai })
    model = openai("gpt-4o-mini")
    // text-embedding-3-small outputs 1536 dimensions — matches our pgvector column
    embeddingModel = openai.embedding("text-embedding-3-small")
  }

  return { model, embeddingModel }
}

function sendProgress(step: string) {
  try {
    chrome.runtime.sendMessage({ action: "capture_progress", payload: { step } }, () => {
      // Ignore errors if popup is closed
      if (chrome.runtime.lastError) {
        // Suppress "Receiving end does not exist"
      }
    })
  } catch (err) {
    // Ignore context invalidated
  }
}

// ---------------------------------------------------------------------------
// Capture logic
// ---------------------------------------------------------------------------

async function processCapture(result: CaptureResult, sendResponse: (res: any) => void) {
  try {
    // --- Auth ---
    const supabase = getSupabaseClient()
    const userId = await getUserId()

    // --- Duplicate Guard ---
    const { data: existing } = await supabase
      .from("nodes")
      .select("id")
      .eq("user_id", userId)
      .eq("url", result.url)
      .maybeSingle()

    if (existing) {
      sendResponse({ success: false, error: "This page has already been captured." })
      return
    }

    // --- Provider & Models ---
    const activeProvider = await storage.get("active-provider") || "openai"
    const keys = {
      openai: ((await storage.get("openai-key")) || "").trim(),
      gemini: ((await storage.get("gemini-key")) || "").trim(),
      anthropic: ((await storage.get("anthropic-key")) || "").trim(),
    }
    const { model, embeddingModel } = getModels(activeProvider, keys)

    // --- Step 1: AI Summary & Entity Extraction ---
    console.log("[Nexus] Generating summary & entities...")
    sendProgress("Generating Summary...")
    const { object } = await generateObject({
      model,
      schema: z.object({
        summary: z.string().describe("A concise summary of the content, max 3 sentences."),
        entities: z.array(z.object({
          name: z.string(),
          type: z.string()
        })).describe("Key concepts, people, or deeply technical terms found in the text.")
      }),
      prompt: `Analyze the following webpage content.\nTitle: ${result.title}\nURL: ${result.url}\n\nContent:\n${result.text.substring(0, 15000)}`
    })
    console.log("[Nexus] AI extraction complete:", object.entities.length, "entities found")

    // --- Step 2: Embedding ---
    console.log("[Nexus] Generating embedding...")
    sendProgress("Creating Embeddings...")
    const { embedding } = await embed({
      model: embeddingModel,
      value: object.summary,
      providerOptions: {
        google: { outputDimensionality: 1536 }
      }
    })

    // --- Step 3: Save Node ---
    console.log("[Nexus] Saving node...")
    sendProgress("Saving to Knowledge Graph...")
    const { data: nodeData, error: nodeError } = await supabase
      .from("nodes")
      .insert({
        user_id: userId,
        url: result.url,
        title: result.title,
        summary: object.summary,
        raw_text: result.text.substring(0, 5000),
        embedding,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (nodeError) throw new Error(`Node save failed: ${nodeError.message}`)
    const nodeId = nodeData.id

    // --- Step 4: Save Entities ---
    if (object.entities.length > 0) {
      console.log("[Nexus] Saving", object.entities.length, "entities...")
      sendProgress(`Saving ${object.entities.length} Entities...`)
      const { error: entityError } = await supabase
        .from("entities")
        .insert(object.entities.map(e => ({
          user_id: userId,
          node_id: nodeId,
          name: e.name,
          type: e.type
        })))

      if (entityError) {
        console.error("[Nexus] Entity save error (non-fatal):", entityError.message)
      }
    }

    // --- Step 5: Create Spaced Repetition Review ---
    console.log("[Nexus] Creating review entry...")
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { error: reviewError } = await supabase.from("reviews").insert({
      user_id: userId,
      node_id: nodeId,
      next_review_date: tomorrow.toISOString(),
      interval: 1,
      ease_factor: 2.5
    })

    if (reviewError) {
      console.error("[Nexus] Review save error (non-fatal):", reviewError.message)
    }

    // --- Step 6: Auto-link via Vector Similarity ---
    console.log("[Nexus] Auto-linking via vector similarity...")
    const { error: matchError } = await supabase.rpc('match_nodes', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 5,
      p_user_id: userId,
      p_source_node_id: nodeId
    })

    if (matchError) {
      console.error("[Nexus] Auto-link error (non-fatal):", matchError.message)
    }

    console.log("[Nexus] ✓ Capture complete!")

    // Save to history
    try {
      const history = (await storage.get<any[]>("capture-history")) || []
      const newEntry = {
        id: nodeId,
        title: result.title,
        url: result.url,
        summary: object.summary,
        timestamp: Date.now()
      }
      history.unshift(newEntry)
      if (history.length > 10) history.pop() // Keep last 10 captures
      await storage.set("capture-history", history)
    } catch (err) {
      console.error("[Nexus] Failed to save history:", err)
    }

    sendResponse({ success: true, summary: object.summary })

  } catch (err: any) {
    console.error("[Nexus] Capture failed:", err.message)
    sendResponse({ success: false, error: err.message })
  }
}

// ---------------------------------------------------------------------------
// Message listeners
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "process_capture" && message.payload) {
    processCapture(message.payload, sendResponse)
    return true // async response
  }

  // Save a new Supabase session (forwarded from the auth-callback content script)
  if (message.action === "save_session") {
    ;(async () => {
      try {
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.setSession({
          access_token: message.session.access_token,
          refresh_token: message.session.refresh_token,
        })
        if (error) {
          console.error("[Nexus] Failed to save session:", error.message)
          sendResponse({ success: false, error: error.message })
        } else {
          console.log("[Nexus] Session saved — extension is authenticated.")
          sendResponse({ success: true })
        }
      } catch (err: any) {
        sendResponse({ success: false, error: err.message })
      }
    })()
    return true
  }

  // Auth status query (used by popup & options page)
  if (message.action === "get_auth_status") {
    ;(async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          sendResponse({ authenticated: true, user: { id: user.id, email: user.email } })
        } else {
          sendResponse({ authenticated: false, user: null })
        }
      } catch {
        sendResponse({ authenticated: false, user: null })
      }
    })()
    return true
  }

  // Sign out
  if (message.action === "sign_out") {
    ;(async () => {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      // Null out the singleton so the next getSupabaseClient() creates a fresh instance.
      // This is safe in a service worker: sign-out is a user-initiated action and
      // subsequent operations will recreate the client from the (now empty) storage.
      supabaseInstance = null
      sendResponse({ success: true })
    })()
    return true
  }
})

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "capture_page") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab?.id) {
        // Set visual indicator that capture started
        chrome.action.setBadgeText({ text: "...", tabId: activeTab.id })
        chrome.action.setBadgeBackgroundColor({ color: "#7c5cfc", tabId: activeTab.id })

        chrome.tabs.sendMessage(activeTab.id, { action: "capture_from_popup" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("[Nexus] capture shortcut error:", chrome.runtime.lastError)
            chrome.action.setBadgeText({ text: "ERR", tabId: activeTab.id })
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId: activeTab.id })
            setTimeout(() => {
              chrome.action.setBadgeText({ text: "", tabId: activeTab.id })
            }, 3000)
          } else {
            console.log("[Nexus] capture initiated from shortcut.")
          }
        })
      }
    })
  }
})

// Listen for messages from content script for shortcut response
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "shortcut_capture_complete") {
    const tabId = sender.tab?.id
    if (tabId) {
      if (message.success) {
        chrome.action.setBadgeText({ text: "✓", tabId })
        chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId })
      } else {
        chrome.action.setBadgeText({ text: "ERR", tabId })
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId })
      }
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "", tabId })
      }, 4000)
    }
  }
})
