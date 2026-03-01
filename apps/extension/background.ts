import { Storage } from "@plasmohq/storage"
import { createClient } from "@supabase/supabase-js"
import { generateObject, embed, generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

import type { CaptureResult } from "~utils/extractor"

const storage = new Storage()

// Since the user might not be signed into the extension identically as the web app,
// the simplest BYOK BYO-DB architecture for the extension right now is to prompt
// for Supabase credentials explicitly in options, OR use a universal backend endpoint.
// We'll initialize it dynamically when processing.

async function getSupabaseClient() {
  // In a real production BYOK app, you'd securely sync the web's auth token to the extension 
  // via messaging or storage (if on same domain).
  // For this prototype, we'll assume the user has set SUPABASE_URL and SUPABASE_ANON_KEY 
  // in their extension options, or we hardcode the public ones for now and rely on a 
  // passed-in JWT (not implemented in UI yet).
  // To keep it simple for the agent test: We'll use the environment variables if available 
  // (requires building with them) but we must pass the user's specific access_token.
  
  const url = process.env.PLASMO_PUBLIC_SUPABASE_URL || ""
  const key = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""
  
  const jwt = (await storage.get("supabase-jwt"))?.trim()
  
  // Note: RLS will fail if we aren't authenticated.
  // We pass the JWT as an Authorization header so Supabase treats requests as authenticated.
  return createClient(url, key, {
    global: {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    }
  })
}

async function processCapture(result: CaptureResult, sendResponse: (res: any) => void) {
  try {
    const activeProvider = await storage.get("active-provider") || "openai"

    // Temporary workaround: We need a User ID to save to Supabase.
    // In a full implementation, we'd get this from `supabase.auth.getSession()`.
    // We'll try to get it, but if it fails, the insert will fail due to RLS.
    const supabase = await getSupabaseClient()
    console.log("DEBUG: Supabase client initialized.")
    const { data: { session } } = await supabase.auth.getSession()
    console.log("DEBUG: Supabase Session:", session ? "Found" : "Not Found")
    
    // For BYOK / Demo purposes, if no session is native to the extension, 
    // we check if they provided a manual JWT override to determine the User ID.
    let userId = session?.user?.id

    if (!userId) {
      const jwt = (await storage.get("supabase-jwt"))?.trim()
      if (jwt) {
         // Attempt to decode the JWT to extract the userId
         try {
           const payload = JSON.parse(atob(jwt.split('.')[1]))
           userId = payload.sub
           console.log("DEBUG: Extracted User ID from Storage JWT:", userId)
         } catch (e) {
           console.warn("DEBUG: Failed to decode JWT payload.", e)
         }
      }
    }

    let model;
    let embeddingModel;

    if (activeProvider === "gemini") {
      const geminiKey = (await storage.get("gemini-key") || "").trim()
      if (!geminiKey) throw new Error("No Gemini key configured in Nexus Settings.")
      const google = createGoogleGenerativeAI({ apiKey: geminiKey })
      model = google("gemini-2.5-flash")
      embeddingModel = google.embedding("gemini-embedding-001")
    } else if (activeProvider === "anthropic") {
      const anthropicKey = (await storage.get("anthropic-key") || "").trim()
      if (!anthropicKey) throw new Error("No Anthropic key configured in Nexus Settings.")
      const anthropic = createAnthropic({ apiKey: anthropicKey })
      model = anthropic("claude-3-5-sonnet-20240620")
      
      // Fallback for embeddings
      const openaiKey = (await storage.get("openai-key") || "").trim()
      const geminiKey = (await storage.get("gemini-key") || "").trim()
      if (openaiKey) {
        embeddingModel = createOpenAI({ apiKey: openaiKey }).embedding("text-embedding-3-small")
      } else if (geminiKey) {
        embeddingModel = createGoogleGenerativeAI({ apiKey: geminiKey }).embedding("gemini-embedding-001")
      } else {
        throw new Error("Anthropic does not supply an embedding model. Please provide an OpenAI or Gemini key as well for embeddings.")
      }
    } else {
      const openaiKey = (await storage.get("openai-key") || "").trim()
      if (!openaiKey) throw new Error("No OpenAI key configured in Nexus Settings.")
      const openai = createOpenAI({ apiKey: openaiKey })
      model = openai("gpt-4o-mini")
      embeddingModel = openai.embedding("text-embedding-3-small")
    }

    // 1. Generate Summary & Entities
    console.log("DEBUG: Starting LLM GenerateObject for summary/entities...")
    const { object } = await generateObject({
      model: model,
      schema: z.object({
        summary: z.string().describe("A concise summary of the content, max 3 sentences."),
        entities: z.array(z.object({
          name: z.string(),
          type: z.string()
        })).describe("Key concepts, people, or deeply technical terms found in the text.")
      }),
      prompt: `Analyze the following webpage content.\nTitle: ${result.title}\nURL: ${result.url}\n\nContent:\n${result.text.substring(0, 15000)}` 
      // substring to avoid context limit blasts for now
    })

    console.log("AI Extraction Complete:", object)

    // 2. Generate Embedding for the summary
    console.log("DEBUG: Starting Text Embedding via provider...")
    const { embedding } = await embed({
      model: embeddingModel,
      value: object.summary,
      providerOptions: {
        google: {
          outputDimensionality: 1536
        }
      }
    })

    console.log("Vector Embedding Complete.")

    if (!userId) {
       console.warn("⚠️ No authenticated Supabase session or JWT found in extension. RLS policies will likely block insertion. Please provide a JWT in Extension Options.")
       throw new Error("Missing Supabase Auth Token. Please set it in Nexus Settings.")
    }

    // 3. Save Node
    console.log("DEBUG: Inserting Node into Supabase...")
    const { data: nodeData, error: nodeError } = await supabase
      .from("nodes")
      .insert({
        user_id: userId, // WARNING: Will be undefined if no session
        url: result.url,
        title: result.title,
        summary: object.summary,
        raw_text: result.text.substring(0, 5000), // Keep a snapshot
        embedding: embedding
      })
      .select('id')
      .single()

    if (nodeError) throw nodeError
    const nodeId = nodeData.id

    // 4. Save Entities
    if (object.entities.length > 0) {
      console.log("DEBUG: Inserting Entities into Supabase...")
      const entitiesToInsert = object.entities.map(e => ({
        user_id: userId,
        node_id: nodeId,
        name: e.name,
        type: e.type
      }))
      
      const { error: entityError } = await supabase
        .from("entities")
        .insert(entitiesToInsert)
      
      if (entityError) console.error("Entity Insert Error:", entityError)
    }

    // 5. Save Review (Spaced Repetition)
    console.log("DEBUG: Inserting Spaced Repetition Review...")
    // Default next review to 1 day from now
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    await supabase.from("reviews").insert({
      user_id: userId,
      node_id: nodeId,
      next_review_date: tomorrow.toISOString(),
      interval: 1,
      ease_factor: 2.5
    })

    // 6. Execute Vector Similarity Match mapping using the RPC function 
    // we defined in supabase_setup.sql
    if (userId) {
       console.log("DEBUG: Executing RPC match_nodes...")
       const { error: matchError } = await supabase.rpc('match_nodes', {
         query_embedding: embedding,
         match_threshold: 0.78, // Cosine similarity threshold (1 - distance)
         match_count: 5,
         p_user_id: userId,
         p_source_node_id: nodeId
       })
       
       if (matchError) {
         console.error("RPC match_nodes error:", matchError)
       } else {
         console.log("Auto-linking complete.")
       }
    }

    sendResponse({ success: true, summary: object.summary })

  } catch (err: any) {
    console.error("Background processing error:", err)
    sendResponse({ success: false, error: err.message })
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "process_capture" && message.payload) {
    processCapture(message.payload, sendResponse)
    return true // indicates we will send response asynchronously
  }
})
