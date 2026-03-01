import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import "./style.css"
import { useState } from "react"

export const storage = new Storage()

function Options() {
  const [openAiKey, setOpenAiKey] = useStorage("openai-key", "")
  const [anthropicKey, setAnthropicKey] = useStorage("anthropic-key", "")
  const [geminiKey, setGeminiKey] = useStorage("gemini-key", "")
  const [activeProvider, setActiveProvider] = useStorage("active-provider", "openai")
  
  // Custom BYOK override for the Database Authentication Layer
  const [supabaseJwt, setSupabaseJwt] = useStorage("supabase-jwt", "")
  
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col p-8 w-full max-w-2xl mx-auto min-h-screen font-sans text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Nexus Settings</h1>
      <p className="text-slate-500 mb-8">
        Configure your AI models to run directly in your browser. Keys are stored locally and never sent to our servers.
      </p>

      <div className="flex flex-col gap-2 mb-8 bg-slate-50 p-4 rounded-md border text-sm">
        <label htmlFor="provider" className="font-semibold text-slate-700">Active AI Provider</label>
        <select
          id="provider"
          className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-xs bg-white"
          value={activeProvider}
          onChange={(e) => setActiveProvider(e.target.value)}
        >
          <option value="openai">OpenAI (GPT-4o mini)</option>
          <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
          <option value="gemini">Google (Gemini 2.5 Flash)</option>
        </select>
        <p className="text-xs text-slate-500 mt-2">
          Note: Anthropic does not provide native vector embeddings. If Anthropic is selected, you must also provide either an OpenAI or Gemini key to generate the embeddings.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="openai" className="font-semibold">OpenAI API Key</label>
          <input
            id="openai"
            type="password"
            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="sk-..."
            value={openAiKey}
            onChange={(e) => setOpenAiKey(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="anthropic" className="font-semibold">Anthropic API Key</label>
          <input
            id="anthropic"
            type="password"
            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="sk-ant-..."
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="gemini" className="font-semibold">Gemini API Key</label>
          <input
            id="gemini"
            type="password"
            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="AI..."
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
          />
        </div>

        <div className="my-4 border-t pt-6">
          <h2 className="text-xl font-bold mb-2">Remote Access Token</h2>
          <p className="text-sm text-slate-500 mb-4">
             To save captures to your secure database, you must provide your authenticated JWT token. 
             You can find this running `console.log(await supabase.auth.getSession())` in the web app.
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor="jwt" className="font-semibold">Supabase JWT Auth Token</label>
            <input
              id="jwt"
              type="password"
              className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseJwt}
              onChange={(e) => setSupabaseJwt(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors"
        >
          Save Keys
        </button>
        {saved && <span className="text-green-600 font-medium">Saved securely!</span>}
      </div>
    </div>
  )
}

export default Options
