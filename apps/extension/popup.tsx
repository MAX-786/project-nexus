import { useState } from "react"

import "./style.css"

function IndexPopup() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleCapture = async () => {
    setIsCapturing(true)
    setErrorMsg(null)
    
    try {
      // Send message to content script to capture
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "capture" }, (response) => {
          setIsCapturing(false)
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
            setErrorMsg("Cannot capture this page. Make sure it's a valid website (not a new tab or chrome:// page) and try refreshing.")
          }
        })
      } else {
        setIsCapturing(false)
        setErrorMsg("No active tab found.")
      }
    } catch (err: any) {
      setIsCapturing(false)
      setErrorMsg(err.message || "An unexpected error occurred.")
    }
  }

  return (
    <div className="flex flex-col p-4 w-72 font-sans bg-white border rounded shadow-sm text-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-blue-600">✦</span> Nexus
        </h2>
        <button 
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-xs text-slate-500 hover:text-slate-800 underline"
        >
          Settings
        </button>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">
        Capture this page to your brain.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 text-center">
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleCapture}
        disabled={isCapturing}
        className="w-full bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isCapturing ? "Capturing..." : "Capture Page"}
      </button>
    </div>
  )
}

export default IndexPopup
