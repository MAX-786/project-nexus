import { useStorage } from "@plasmohq/storage/hook"
import { useState, useEffect } from "react"

import "./style.css"

const providers = [
  { id: "openai", label: "OpenAI", model: "GPT-4o mini" },
  { id: "gemini", label: "Gemini", model: "2.5 Flash" },
  { id: "anthropic", label: "Anthropic", model: "Claude 3.5" },
] as const

function Options() {
  const [openAiKey, setOpenAiKey] = useStorage("openai-key", "")
  const [anthropicKey, setAnthropicKey] = useStorage("anthropic-key", "")
  const [geminiKey, setGeminiKey] = useStorage("gemini-key", "")
  const [activeProvider, setActiveProvider] = useStorage("active-provider", "openai")

  // Auth state
  const [authUser, setAuthUser] = useState<{ email: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Show/hide key toggles
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const toggleShow = (key: string) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))

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

  const handleSignIn = () => {
    const siteUrl = process.env.PLASMO_PUBLIC_SITE_URL || "http://localhost:3000"
    chrome.tabs.create({ url: `${siteUrl}/auth/extension` })
  }

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ action: "sign_out" }, () => {
      setAuthUser(null)
    })
  }

  return (
    <div className="dark">
      <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans">
        <div className="max-w-xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#a855f7] shadow-lg shadow-[#7c5cfc33]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 0-9 9c0 3.6 2.4 6.5 4.5 8.5L12 22l4.5-2.5C18.6 17.5 21 14.6 21 11a9 9 0 0 0-9-9z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Nexus Settings</h1>
              <p className="text-xs text-nexus-muted">Your keys stay local · Never sent to our servers</p>
            </div>
          </div>

          {/* Provider Selector */}
          <section className="mt-8">
            <label className="text-xs font-semibold uppercase tracking-wider text-nexus-muted mb-3 block">
              AI Provider
            </label>
            <div className="flex gap-2 p-1 bg-nexus-card rounded-xl border border-nexus-border">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProvider(p.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    activeProvider === p.id
                      ? "bg-nexus-primary text-white shadow-md shadow-nexus-primary/25"
                      : "text-nexus-muted hover:text-nexus-text hover:bg-nexus-border/50"
                  }`}
                >
                  <span className="block font-semibold">{p.label}</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">{p.model}</span>
                </button>
              ))}
            </div>
            {activeProvider === "anthropic" && (
              <p className="text-[11px] text-nexus-muted mt-2 pl-1">
                ⚠ Anthropic has no embedding model. Add an OpenAI or Gemini key too for vector search.
              </p>
            )}
          </section>

          {/* API Keys */}
          <section className="mt-8 space-y-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-nexus-muted block">
              API Keys
            </label>

            <KeyInput
              id="openai"
              label="OpenAI"
              placeholder="sk-..."
              value={openAiKey}
              onChange={setOpenAiKey}
              show={showKeys["openai"]}
              onToggle={() => toggleShow("openai")}
              active={activeProvider === "openai"}
            />

            <KeyInput
              id="gemini"
              label="Gemini"
              placeholder="AI..."
              value={geminiKey}
              onChange={setGeminiKey}
              show={showKeys["gemini"]}
              onToggle={() => toggleShow("gemini")}
              active={activeProvider === "gemini"}
            />

            <KeyInput
              id="anthropic"
              label="Anthropic"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={setAnthropicKey}
              show={showKeys["anthropic"]}
              onToggle={() => toggleShow("anthropic")}
              active={activeProvider === "anthropic"}
            />
          </section>

          {/* Keyboard Shortcuts */}
          <section className="mt-8 pt-6 border-t border-nexus-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-nexus-muted mb-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2.5" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
              </svg>
              Keyboard Shortcuts
            </h2>
            <div className="flex items-center justify-between p-3 bg-nexus-card border border-nexus-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-nexus-text">Capture Page</p>
                <p className="text-[11px] text-nexus-muted mt-0.5">Instantly capture without opening the popup</p>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <kbd className="px-2 py-1 rounded-md bg-nexus-bg border border-nexus-border/80 text-nexus-muted shadow-sm">Alt</kbd>
                <span className="text-nexus-muted/50">+</span>
                <kbd className="px-2 py-1 rounded-md bg-nexus-bg border border-nexus-border/80 text-nexus-muted shadow-sm">Shift</kbd>
                <span className="text-nexus-muted/50">+</span>
                <kbd className="px-2 py-1 rounded-md bg-nexus-bg border border-nexus-border/80 text-nexus-muted shadow-sm">C</kbd>
              </div>
            </div>
            <p className="text-[10px] text-nexus-muted mt-2 pl-1">
              You can customize this shortcut in Chrome at: <span className="font-mono text-nexus-text/70">chrome://extensions/shortcuts</span>
            </p>
          </section>

          {/* Account / Auth Section */}
          <section className="mt-8 pt-6 border-t border-nexus-border">
            <label className="text-xs font-semibold uppercase tracking-wider text-nexus-muted mb-3 block">
              Account
            </label>

            {authLoading ? (
              <div className="flex items-center gap-2 p-3 bg-nexus-card border border-nexus-border rounded-lg">
                <div className="h-1.5 w-1.5 rounded-full bg-nexus-muted animate-pulse" />
                <span className="text-xs text-nexus-muted">Checking auth status…</span>
              </div>
            ) : authUser ? (
              <div className="p-3 bg-nexus-card border border-nexus-border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-nexus-success" />
                  <span className="text-xs text-nexus-success font-medium">Signed in</span>
                </div>
                <p className="text-xs text-nexus-muted font-mono truncate">{authUser.email}</p>
                <button
                  onClick={handleSignOut}
                  className="w-full text-xs font-medium py-1.5 px-3 rounded-md border border-nexus-border text-nexus-muted hover:text-nexus-error hover:border-nexus-error/50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-3 bg-nexus-card border border-nexus-border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-nexus-warning" />
                  <span className="text-xs text-nexus-warning font-medium">Not signed in</span>
                </div>
                <p className="text-[11px] text-nexus-muted">
                  Connect your Nexus account to enable page captures.
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-nexus-primary text-white hover:opacity-90 transition-opacity"
                >
                  Sign In with Nexus →
                </button>
              </div>
            )}
          </section>

          {/* Status bar */}
          <div className="mt-8 flex items-center gap-2 text-[11px] text-nexus-muted">
            <div className="h-1.5 w-1.5 rounded-full bg-nexus-success animate-pulse" />
            Settings auto-save as you type
          </div>
        </div>
      </div>
    </div>
  )
}

function KeyInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  active,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  active: boolean
}) {
  return (
    <div className={`rounded-xl border p-3 transition-colors ${
      active ? "border-nexus-primary/40 bg-nexus-primary/5" : "border-nexus-border bg-nexus-card"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="text-xs font-medium flex items-center gap-2">
          {label}
          {active && (
            <span className="text-[10px] bg-nexus-primary/20 text-nexus-primary px-1.5 py-0.5 rounded font-medium">
              Active
            </span>
          )}
        </label>
        {value && (
          <span className="text-[10px] text-nexus-success flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-nexus-success" />
            Saved
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="w-full bg-nexus-bg/50 border border-nexus-border/60 rounded-lg px-3 py-2 text-xs text-nexus-text placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-nexus-primary/40 transition-all font-mono"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexus-muted hover:text-nexus-text transition-colors"
        >
          {show ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default Options
