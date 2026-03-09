import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"

import "./style.css"

const storage = new Storage()

/** Returns today's date as YYYY-MM-DD for daily counter resets */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function IndexPopup() {
  const [status, setStatus] = useState<"idle" | "extracting" | "processing" | "done" | "error">("idle")
  const [progressStep, setProgressStep] = useState<string>("Processing with AI...")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [captureCount, setCaptureCount] = useState(0)
  const [authUser, setAuthUser] = useState<{ email: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [history, setHistory] = useState<any[]>([])

  // Load history
  const loadHistory = async () => {
    const hist = await storage.get<any[]>("capture-history")
    if (hist) setHistory(hist)
  }
  useEffect(() => {
    loadHistory()
  }, [])

  // Check auth status
  useEffect(() => {
    chrome.runtime.sendMessage({ action: "get_auth_status" }, (response) => {
      if (chrome.runtime.lastError) {
        setAuthLoading(false)
        return
      }
      setAuthUser(response?.authenticated ? { email: response.user.email } : null)
      setAuthLoading(false)
    })
  }, [])

  // Listen for capture progress from background script
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.action === "capture_progress" && msg.payload?.step) {
        setProgressStep(msg.payload.step)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  // Load today's capture count on mount
  useEffect(() => {
    ;(async () => {
      const storedDate = await storage.get("capture-count-date")
      if (storedDate === todayKey()) {
        const count = parseInt((await storage.get("capture-count")) || "0", 10)
        setCaptureCount(count)
      } else {
        // New day — reset
        await storage.set("capture-count", "0")
        await storage.set("capture-count-date", todayKey())
        setCaptureCount(0)
      }
    })()
  }, [])

  const incrementCaptureCount = async () => {
    const newCount = captureCount + 1
    setCaptureCount(newCount)
    await storage.set("capture-count", String(newCount))
    await storage.set("capture-count-date", todayKey())
  }

  const handleCapture = async () => {
    if (!authUser) return
    setStatus("extracting")
    setProgressStep("Extracting...")
    setToast(null)

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tabs[0]?.id) {
        setStatus("error")
        setToast({ message: "No active tab found.", type: "error" })
        return
      }

      // Send to content script to extract, which then sends to background
      chrome.tabs.sendMessage(tabs[0].id, { action: "capture_from_popup" }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus("error")
          setToast({ message: "Cannot capture this page. Make sure it's a valid website and try refreshing.", type: "error" })
          return
        }

        if (!response) {
          setStatus("processing")
          return
        }

        // Response from content script after background finishes
        if (response.success) {
          setStatus("done")
          setToast({ message: `Captured: ${tabs[0]!.title?.substring(0, 50) || "Page"}`, type: "success" })
          incrementCaptureCount()
          loadHistory()
          setTimeout(() => setToast(null), 3000)
        } else {
          setStatus("error")
          setToast({ message: response.error || "Unknown error", type: "error" })
        }
      })

      // Show processing state while waiting
      setTimeout(() => {
        setStatus((prev) => (prev === "extracting" ? "processing" : prev))
      }, 500)

    } catch (err: any) {
      setStatus("error")
      setToast({ message: err.message || "An unexpected error occurred.", type: "error" })
    }
  }

  const isCapturing = status === "extracting" || status === "processing"

  const statusLabel: Record<string, string> = {
    idle: "Capture Page",
    extracting: "Extracting…",
    processing: progressStep,
    done: "Captured!",
    error: "Try Again",
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

          {/* Auth Loading */}
          {authLoading && (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-nexus-spin h-5 w-5 text-nexus-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          )}

          {/* Not signed in state */}
          {!authLoading && !authUser && (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-nexus-warning/10 border border-nexus-warning/20 rounded-lg space-y-2">
                <p className="text-xs text-nexus-warning font-medium">Not signed in</p>
                <p className="text-[11px] text-nexus-muted">Sign in to start capturing pages to your knowledge graph.</p>
              </div>
              <button
                onClick={() => {
                  const siteUrl = process.env.PLASMO_PUBLIC_SITE_URL || "http://localhost:3000"
                  chrome.tabs.create({ url: `${siteUrl}/auth/extension` })
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-[#7c5cfc] to-[#a855f7] hover:from-[#6b4ce0] hover:to-[#9333ea] shadow-lg shadow-[#7c5cfc33] transition-all"
              >
                Sign In with Nexus →
              </button>
            </div>
          )}

          {/* Signed in state */}
          {!authLoading && authUser && (
            <>
              <p className="text-xs text-nexus-muted">
                Capture this page to your knowledge graph.
              </p>

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

              {/* Capture History */}
              <div className="mt-4 border-t border-nexus-border pt-3">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-semibold text-nexus-muted">Recent Captures</span>
                  {history.length > 0 && (
                    <button
                      onClick={async () => {
                        await storage.remove("capture-history")
                        setHistory([])
                      }}
                      className="text-[10px] text-nexus-muted hover:text-nexus-error transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {history.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {history.map((item, idx) => (
                      <li key={item.id || idx} className="bg-nexus-border/20 p-2.5 rounded-lg border border-nexus-border/50 hover:bg-nexus-border/40 transition-colors">
                        <a href={item.url} target="_blank" rel="noreferrer" className="block outline-none">
                          <h4 className="text-xs font-medium text-white mb-1 truncate">{item.title}</h4>
                          <p className="text-[10px] text-nexus-muted line-clamp-2 leading-tight">{item.summary}</p>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 px-4 bg-nexus-border/10 rounded-lg border border-dashed border-nexus-border/50">
                    <svg className="w-6 h-6 mx-auto text-nexus-muted/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-[11px] text-nexus-muted mb-1">No captures yet</p>
                    <p className="text-[9px] text-nexus-muted/70">Click Capture Page to save this site.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Toast Container */}
        {toast && (
          <div className={
            `absolute bottom-4 left-4 right-4 p-3 rounded-lg text-xs shadow-lg animate-nexus-slide-up border flex items-start gap-2 ` + 
            (toast.type === "success" 
              ? "bg-[#111827] border-nexus-success/30 text-nexus-success shadow-nexus-success/10" 
              : "bg-[#111827] border-nexus-error/30 text-nexus-error shadow-nexus-error/10")
          }>
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="flex-1 text-white/90 leading-tight">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-white/50 hover:text-white shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
