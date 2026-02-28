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

  // Listen for messages from popup
  useEffect(() => {
    const messageListener = async (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === "capture") {
        await handleCapture()
        sendResponse({ success: true })
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  const handleCapture = async () => {
    try {
      const result = await extractPageContent()
      
      console.log("Extracted Content:", result)

      if (result.isYoutube && result.text === "No transcript available to capture.") {
        setToastMessage("No transcript available to capture.")
      } else if (!result.text) {
         setToastMessage("Could not extract any text from this page.")
      } else {
        setToastMessage("Processing with AI...")
        
        // Send to background script
        chrome.runtime.sendMessage(
          { action: "process_capture", payload: result },
          (response) => {
             if (response?.success) {
               setToastMessage("Page captured and connected to Nexus!")
             } else {
               setToastMessage(`Failed: ${response?.error || "Unknown error"}`)
             }
             setShowToast(true)
             setTimeout(() => setShowToast(false), 3000)
          }
        )
        return // Early return so we don't clear toast immediately below
      }
      
    } catch (err) {
      console.error(err)
      setToastMessage("Failed to capture page.")
    } finally {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  return (
    <div className="plasmo-z-50 plasmo-flex plasmo-fixed plasmo-top-4 plasmo-right-4">
      {/* Floating Capture Button (optional, can just rely on popup) */}
      <button
        onClick={handleCapture}
        className="plasmo-bg-black plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-full plasmo-shadow-lg plasmo-font-bold plasmo-text-sm hover:plasmo-bg-slate-800 plasmo-transition-all plasmo-flex plasmo-items-center plasmo-gap-2"
        title="Capture to Nexus"
      >
        <span>✦</span> Capture
      </button>

      {/* Toast Notification */}
      {showToast && (
        <div className="plasmo-fixed plasmo-top-16 plasmo-right-4 plasmo-bg-white plasmo-text-black plasmo-border plasmo-border-slate-200 plasmo-px-4 plasmo-py-3 plasmo-rounded-md plasmo-shadow-xl plasmo-text-sm plasmo-animate-in plasmo-slide-in-from-right">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
