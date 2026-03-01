import { useState } from "react"

import "./style.css"

function IndexPopup() {
  const [status, setStatus] = useState<"idle" | "extracting" | "processing" | "done" | "error" | "jwt_expired">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastCapture, setLastCapture] = useState<string | null>(null)

  const handleCapture = async () => {
    setStatus("extracting")
    setErrorMsg(null)

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tabs[0]?.id) {
        setStatus("error")
        setErrorMsg("No active tab found.")
        return
      }

      // Send to content script to extract, which then sends to background
      chrome.tabs.sendMessage(tabs[0].id, { action: "capture_from_popup" }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus("error")
          setErrorMsg("Cannot capture this page. Make sure it's a valid website and try refreshing.")
          return
        }

        if (!response) {
          setStatus("processing")
          return
        }

        // Response from content script after background finishes
        if (response.code === "jwt_expired") {
          setStatus("jwt_expired")
          setErrorMsg(response.error)
        } else if (response.success) {
          setStatus("done")
          setLastCapture(tabs[0].title || "Page")
        } else {
          setStatus("error")
          setErrorMsg(response.error || "Unknown error")
        }
      })

      // Show processing state while waiting
      setTimeout(() => {
        setStatus((prev) => prev === "extracting" ? "processing" : prev)
      }, 500)

    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message || "An unexpected error occurred.")
    }
  }

  const isCapturing = status === "extracting" || status === "processing"

  const statusLabel: Record<string, string> = {
    idle: "Capture Page",
    extracting: "Extracting…",
    processing: "Processing with AI…",
    done: "Captured!",
    error: "Try Again",
    jwt_expired: "Token Expired",
  }

  return (
    <div className="dark">
      <div className="flex flex-col w-80 bg-nexus-bg text-nexus-text font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-nexus-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#a855f7] shadow-lg shadow-[#7c5cfc33]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 0-9 9c0 3.6 2.4 6.5 4.5 8.5L12 22l4.5-2.5C18.6 17.5 21 14.6 21 11a9 9 0 0 0-9-9z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight">Nexus</span>
          </div>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="text-xs text-nexus-muted hover:text-nexus-text transition-colors"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-nexus-muted">
            Capture this page to your knowledge graph.
          </p>

          {/* JWT Expired */}
          {status === "jwt_expired" && (
            <div className="p-3 bg-nexus-error/10 border border-nexus-error/20 rounded-lg animate-nexus-fade-in space-y-2">
              <p className="text-xs text-nexus-error font-medium">⚠ Auth token expired</p>
              <p className="text-[11px] text-nexus-muted">Your session has expired. Get a fresh token from the web app and paste it in Settings.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const siteUrl = process.env.PLASMO_PUBLIC_SITE_URL || "http://localhost:3000"
                    chrome.tabs.create({ url: `${siteUrl}/api/jwt` })
                  }}
                  className="flex-1 text-xs font-medium py-1.5 px-3 rounded-md bg-nexus-primary text-white hover:bg-nexus-primary-hover transition-colors"
                >
                  Get Token →
                </button>
                <button
                  onClick={() => chrome.runtime.openOptionsPage()}
                  className="flex-1 text-xs font-medium py-1.5 px-3 rounded-md border border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-nexus-muted transition-colors"
                >
                  Settings
                </button>
              </div>
            </div>
          )}

          {/* Generic Error */}
          {errorMsg && status === "error" && (
            <div className="p-2.5 bg-nexus-error/10 border border-nexus-error/20 rounded-lg text-xs text-nexus-error animate-nexus-fade-in">
              {errorMsg}
            </div>
          )}

          {/* Last capture success */}
          {status === "done" && lastCapture && (
            <div className="p-2.5 bg-nexus-success/10 border border-nexus-success/20 rounded-lg text-xs text-nexus-success animate-nexus-fade-in">
              ✓ Captured: {lastCapture.substring(0, 50)}{lastCapture.length > 50 ? "…" : ""}
            </div>
          )}

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-[#7c5cfc] to-[#a855f7] hover:from-[#6b4ce0] hover:to-[#9333ea] shadow-lg shadow-[#7c5cfc33] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isCapturing && (
              <svg className="animate-nexus-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {statusLabel[status]}
          </button>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
