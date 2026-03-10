---
sidebar_position: 3
---

# BYOK Privacy Model

A technical explanation of how the Bring Your Own Key (BYOK) model works in Project Nexus and why it was chosen.

## Philosophy

Project Nexus follows a **Privacy-First** philosophy. For free-tier users, all AI processing must happen directly in the user's browser using their own API keys. Nothing routes through our servers.

This means:
- We never see your API keys.
- We never see the content you capture.
- Your knowledge base is stored in your own Supabase instance.

## Where Keys Are Stored

**Extension keys** are stored in browser local storage via `@plasmohq/storage` (which wraps `chrome.storage.local`):

| Key | Value |
|---|---|
| `openai-key` | OpenAI API key |
| `anthropic-key` | Anthropic API key |
| `gemini-key` | Google Gemini API key |
| `active-provider` | Which provider to use for the next capture |

**Memory Agent keys** are stored in browser `localStorage` via Zustand with the key `nexus-memory-settings`.

## API Call Flow

```
Extension (Browser)
  ↓ reads key from chrome.storage.local
  ↓ constructs LLM API request
  → LLM Provider (OpenAI / Anthropic / Gemini) directly
  ← Structured JSON response
  → Supabase (user's own database via session)
```

No data ever passes through our Next.js backend during AI processing.

## Supabase Session Security

The extension uses a **Supabase session** (access & refresh tokens) to authenticate database writes. This session:
- Is scoped to your Supabase project.
- Automatically refreshes in the background.
- Is transferred securely from the web dashboard via the one-click Connect Extension flow.
- Grants only the permissions defined by your Supabase RLS policies (i.e., only your own data).

## Tier Comparison

| Feature | Hacker (Free) | Nexus Cloud | Nexus Pro |
|---|---|---|---|
| AI processing | Client-side (BYOK) | Client-side (BYOK) | Server-routed (our keys) |
| Database | Self-hosted Supabase | Managed (we host it) | Managed (we host it) |
| API keys required | Yes — your own keys | Yes — your own keys | No — we provide credits |
| Privacy | Highest | High | Standard |

## Security Considerations

- API keys stored in `chrome.storage.local` are isolated to the extension origin. Web pages cannot access them.
- The Supabase session provides no more access than your RLS policies allow.
- If you are on a shared computer, always clear your extension storage when done.
- Do not paste your API keys anywhere other than the extension Options page.
