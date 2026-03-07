import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"
import { extractPageContent } from "~utils/extractor"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export default function CaptureButtonOverlay() {
  // Listen for messages from popup
  useEffect(() => {
    const messageListener = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === "capture") {
        handleCapture()
        sendResponse({ success: true })
      } else if (message.action === "capture_from_popup") {
        // Popup needs the full response back (including jwt_expired)
        handleCaptureWithResponse(sendResponse)
        return true // keep channel open for async response
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  // Called from popup or shortcut — relays the full background response back
  const handleCaptureWithResponse = async (sendResponse: (res?: any) => void) => {
    try {
      const result = await extractPageContent()

      if (result.isYoutube && result.text === "No transcript available to capture.") {
        sendResponse({ success: false, error: "No transcript available to capture." })
        chrome.runtime.sendMessage({ action: "shortcut_capture_complete", success: false })
        return
      }
      if (!result.text) {
        sendResponse({ success: false, error: "Could not extract text from this page." })
        chrome.runtime.sendMessage({ action: "shortcut_capture_complete", success: false })
        return
      }

      chrome.runtime.sendMessage(
        { action: "process_capture", payload: result },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: "Extension context invalidated. Refresh the page." })
            chrome.runtime.sendMessage({ action: "shortcut_capture_complete", success: false })
          } else {
            // Relay the full background response (including code: "jwt_expired")
            sendResponse(response)
            chrome.runtime.sendMessage({ action: "shortcut_capture_complete", success: response?.success })
          }
        }
      )
    } catch (err: any) {
      sendResponse({ success: false, error: err.message || "Capture failed." })
      chrome.runtime.sendMessage({ action: "shortcut_capture_complete", success: false })
    }
  }

  // Fallback for keyboard shortcut or programmatic capture
  const handleCapture = async () => {
    try {
      const result = await extractPageContent()

      if (result.isYoutube && result.text === "No transcript available to capture.") {
        return
      }

      if (!result.text) {
        return
      }

      try {
        chrome.runtime.sendMessage(
          { action: "process_capture", payload: result },
          () => {} // No UI feedback here anymore, happens invisibly
        )
      } catch (err: any) {
        console.error(err)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return null
}
