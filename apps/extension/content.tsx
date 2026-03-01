import cssText from "data-text:~style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"

import { extractPageContent } from "~utils/extractor"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export default function CaptureButtonOverlay() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"info" | "success" | "error">("info")

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

  const showNotification = (msg: string, type: "info" | "success" | "error") => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    if (type !== "info") {
      setTimeout(() => setShowToast(false), 4000)
    }
  }

  // Called from popup — relays the full background response back
  const handleCaptureWithResponse = async (sendResponse: (res?: any) => void) => {
    try {
      const result = await extractPageContent()

      if (result.isYoutube && result.text === "No transcript available to capture.") {
        sendResponse({ success: false, error: "No transcript available." })
        return
      }
      if (!result.text) {
        sendResponse({ success: false, error: "Could not extract text." })
        return
      }

      showNotification("Processing with AI…", "info")

      chrome.runtime.sendMessage(
        { action: "process_capture", payload: result },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: "Extension context invalidated. Refresh the page." })
          } else {
            // Relay the full background response (including code: "jwt_expired")
            if (response?.success) {
              showNotification("✓ Captured and connected to Nexus!", "success")
            } else if (response?.code === "jwt_expired") {
              showNotification("Auth token expired. Update it in Settings.", "error")
            } else {
              showNotification(response?.error || "Unknown error", "error")
            }
            sendResponse(response)
          }
        }
      )
    } catch (err: any) {
      sendResponse({ success: false, error: err.message || "Capture failed." })
    }
  }

  const handleCapture = async () => {
    try {
      const result = await extractPageContent()

      if (result.isYoutube && result.text === "No transcript available to capture.") {
        showNotification("No transcript available to capture.", "error")
        return
      }

      if (!result.text) {
        showNotification("Could not extract any text from this page.", "error")
        return
      }

      showNotification("Processing with AI…", "info")

      try {
        chrome.runtime.sendMessage(
          { action: "process_capture", payload: result },
          (response) => {
            if (chrome.runtime.lastError) {
              showNotification("Extension updated. Please refresh the page!", "error")
            } else if (response?.success) {
              showNotification("✓ Captured and connected to Nexus!", "success")
            } else {
              showNotification(response?.error || "Unknown error", "error")
            }
          }
        )
      } catch (err: any) {
        if (err.message?.includes("Extension context invalidated")) {
          showNotification("Extension updated. Please refresh the page!", "error")
        } else {
          showNotification("Failed to communicate with extension.", "error")
        }
      }
    } catch (err) {
      console.error(err)
      showNotification("Failed to capture page.", "error")
    }
  }

  const toastColors = {
    info: "plasmo-bg-[#13131f] plasmo-text-[#e0e0e8] plasmo-border-[#7c5cfc33]",
    success: "plasmo-bg-[#13131f] plasmo-text-[#34d399] plasmo-border-[#34d39933]",
    error: "plasmo-bg-[#13131f] plasmo-text-[#f87171] plasmo-border-[#f8717133]",
  }

  return (
    <div className="plasmo-z-[999999] plasmo-flex plasmo-fixed plasmo-top-4 plasmo-right-4 plasmo-flex-col plasmo-items-end plasmo-gap-3 plasmo-font-sans">
      {/* Floating Capture Button */}
      <button
        onClick={handleCapture}
        className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-2.5 plasmo-rounded-full plasmo-shadow-xl plasmo-font-semibold plasmo-text-sm plasmo-text-white plasmo-bg-gradient-to-r plasmo-from-[#7c5cfc] plasmo-to-[#a855f7] hover:plasmo-from-[#6b4ce0] hover:plasmo-to-[#9333ea] plasmo-transition-all hover:plasmo-scale-105 active:plasmo-scale-95"
        title="Capture to Nexus"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a9 9 0 0 0-9 9c0 3.6 2.4 6.5 4.5 8.5L12 22l4.5-2.5C18.6 17.5 21 14.6 21 11a9 9 0 0 0-9-9z" />
          <circle cx="12" cy="11" r="3" />
        </svg>
        Capture
      </button>

      {/* Toast Notification */}
      {showToast && (
        <div className={`plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-3 plasmo-rounded-xl plasmo-border plasmo-shadow-2xl plasmo-text-sm plasmo-max-w-xs animate-nexus-slide-in ${toastColors[toastType]}`}>
          {toastType === "info" && (
            <svg className="plasmo-h-4 plasmo-w-4 plasmo-shrink-0 animate-nexus-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
