import { Storage } from "@plasmohq/storage"
import { createClient } from "@supabase/supabase-js"
import { generateObject, embed } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

import type { CaptureResult } from "~utils/extractor"

const storage = new Storage()

async function getSupabaseClient() {
  const url = process.env.PLASMO_PUBLIC_SUPABASE_URL || ""
  const key = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""
  
  const jwt = (await storage.get("supabase-jwt"))?.trim()
  
  return createClient(url, key, {
    global: {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    }
  })
}

async function getUserId(supabase: any): Promise<string> {
  // Try native session first
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) return session.user.id

  // Fallback: decode JWT from storage
  const jwt = (await storage.get("supabase-jwt"))?.trim()
  if (jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]))
      if (payload.sub) return payload.sub
    } catch (e) {
      console.warn("Failed to decode JWT payload.", e)
    }
  }

  throw new Error("Missing Supabase Auth Token. Please set it in Nexus Settings.")
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

async function processCapture(result: CaptureResult, sendResponse: (res: any) => void) {
  try {
    // --- Auth ---
    const supabase = await getSupabaseClient()
    const userId = await getUserId(supabase)

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

    // Detect JWT expiration and clear the stored token
    const msg = err.message || ""
    const isJwtExpired = msg.includes("JWT expired") || msg.includes("Invalid JWT") || msg.includes("invalid claim: exp")

    if (isJwtExpired) {
      await storage.remove("supabase-jwt")
      console.warn("[Nexus] JWT expired — cleared stored token.")
      sendResponse({
        success: false,
        error: "Your auth token has expired. Please get a fresh token from the Nexus web app.",
        code: "jwt_expired"
      })
    } else {
      sendResponse({ success: false, error: msg })
    }
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "process_capture" && message.payload) {
    processCapture(message.payload, sendResponse)
    return true // async response
  }
})

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "capture_page") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: "capture_from_popup" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("[Nexus] capture shortcut error:", chrome.runtime.lastError)
          } else {
            console.log("[Nexus] capture initiated from shortcut.")
          }
        })
      }
    })
  }
})
