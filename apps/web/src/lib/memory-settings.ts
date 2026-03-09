import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MemoryProvider = 'openai' | 'gemini'
export type MemoryMode = 'auto' | 'manual'

export interface MemorySettings {
  /** 'auto' calls the AI provider directly; 'manual' uses copy-paste BYOK flow */
  mode: MemoryMode
  /** Which LLM provider to use */
  provider: MemoryProvider
  /** User's API key — stored only in localStorage, never sent to our servers */
  apiKey: string
  /** Model name override (empty = use default for provider) */
  model: string
}

interface MemorySettingsStore extends MemorySettings {
  setMode: (mode: MemoryMode) => void
  setProvider: (provider: MemoryProvider) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
  /** True when auto mode is fully configured (has key + provider) */
  isAutoReady: () => boolean
}

// ─── Default Models ──────────────────────────────────────────────────────────

export const DEFAULT_MODELS: Record<MemoryProvider, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
}

export const PROVIDER_LABELS: Record<MemoryProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
}

export const MODEL_OPTIONS: Record<MemoryProvider, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'],
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useMemorySettings = create<MemorySettingsStore>()(
  persist(
    (set, get) => ({
      mode: 'manual',
      provider: 'openai',
      apiKey: '',
      model: '',

      setMode: (mode) => set({ mode }),
      setProvider: (provider) => set({ provider, model: '' }),
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),

      isAutoReady: () => {
        const { mode, apiKey } = get()
        return mode === 'auto' && apiKey.trim().length > 0
      },
    }),
    {
      name: 'nexus-memory-settings',
    },
  ),
)
