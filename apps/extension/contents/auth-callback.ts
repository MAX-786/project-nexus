import type { PlasmoCSConfig } from "plasmo"

/**
 * Auth Callback Content Script
 *
 * Injected into the web app's /auth/extension page.
 * Listens for the NEXUS_EXTENSION_AUTH postMessage from the page,
 * forwards the Supabase session to the background service worker,
 * then posts NEXUS_EXTENSION_AUTH_SUCCESS back so the page can close.
 */

const SITE_URL = process.env.PLASMO_PUBLIC_SITE_URL || "http://localhost:3000"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  run_at: "document_idle"
}

window.addEventListener("message", (event) => {
  // Verify the message comes from our web app origin
  try {
    const expectedOrigin = new URL(SITE_URL).origin
    if (event.origin !== expectedOrigin) return
  } catch {
    return
  }

  if (event.data?.type !== "NEXUS_EXTENSION_AUTH") return

  const session = event.data.session
  if (!session?.access_token || !session?.refresh_token) return

  // Forward the session to the background service worker
  chrome.runtime.sendMessage({ action: "save_session", session }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Nexus] Failed to send session to background:", chrome.runtime.lastError.message)
      return
    }
    if (response?.success) {
      // Notify the page that auth is complete so it can show success & close
      window.postMessage({ type: "NEXUS_EXTENSION_AUTH_SUCCESS" }, event.origin)
    }
  })
})
