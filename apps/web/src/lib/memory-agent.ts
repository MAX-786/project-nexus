import {
  DEFAULT_MODELS,
  type MemoryProvider,
} from './memory-settings'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LLMCallOptions {
  provider: MemoryProvider
  apiKey: string
  model?: string
  prompt: string
}

export interface LLMResult {
  text: string
  error?: undefined
}

export interface LLMError {
  text?: undefined
  error: string
}

export type LLMResponse = LLMResult | LLMError

// ─── Provider Endpoints ──────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<LLMResponse> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg =
      (body as { error?: { message?: string } })?.error?.message ??
      `OpenAI API error ${res.status}`
    return { error: msg }
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) return { error: 'Empty response from OpenAI' }
  return { text }
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg =
      (body as { error?: { message?: string } })?.error?.message ??
      `Gemini API error ${res.status}`
    return { error: msg }
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) return { error: 'Empty response from Gemini' }
  return { text }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Calls the configured LLM provider directly from the browser.
 * The API key never leaves the client — it's sent directly to the provider.
 */
export async function callMemoryAgent(
  opts: LLMCallOptions,
): Promise<LLMResponse> {
  const { provider, apiKey, prompt } = opts
  const model = opts.model || DEFAULT_MODELS[provider]

  if (!apiKey.trim()) {
    return { error: 'No API key configured. Add one in Settings → Memory Agent.' }
  }

  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(apiKey, model, prompt)
      case 'gemini':
        return await callGemini(apiKey, model, prompt)
      default:
        return { error: `Unsupported provider: ${provider}` }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error calling AI provider'
    return { error: message }
  }
}
