import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import "./style.css"
import { useState } from "react"

export const storage = new Storage()

function Options() {
  const [openAiKey, setOpenAiKey] = useStorage("openai-key", "")
  const [anthropicKey, setAnthropicKey] = useStorage("anthropic-key", "")
  const [geminiKey, setGeminiKey] = useStorage("gemini-key", "")
  
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
