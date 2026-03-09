---
sidebar_position: 1
---

# Extension Overview

The Project Nexus browser extension is built with [Plasmo](https://www.plasmo.com/) (React + TypeScript) and runs as a Chrome Manifest V3 extension.

## Extension Components

| File | Purpose |
|---|---|
| `popup.tsx` | The main popup UI shown when you click the toolbar icon. |
| `options.tsx` | The settings page (BYOK keys, provider selection, JWT token). |
| `background.ts` | Service worker handling capture processing and API calls. |
| `content.tsx` | Content script injected into pages for DOM extraction. |

## Permissions

The extension requests these Chrome permissions:

- **`activeTab`** — read the content of the current tab for capture.
- **`storage`** — save API keys and settings to local browser storage.
- **`scripting`** — inject the content script for DOM extraction.

## Data Flow

```
User clicks "Capture"
  ↓
popup.tsx sends message to background.ts
  ↓
background.ts sends message to content.tsx
  ↓
content.tsx scrapes article text / YouTube transcript
  ↓
background.ts calls LLM API (your key, direct call)
  ↓
background.ts calls Supabase API (your JWT)
  ↓
Node saved + embedding generated + edges auto-created
  ↓
popup.tsx shows success state
```

## Storage Keys

All settings are stored in browser local storage via Plasmo Storage:

| Key | Contents |
|---|---|
| `openai-key` | OpenAI API key |
| `anthropic-key` | Anthropic API key |
| `gemini-key` | Gemini API key |
| `active-provider` | Currently selected provider (`openai` / `anthropic` / `gemini`) |
| `supabase-jwt` | Supabase session JWT for database writes |
| `capture-history` | Array of recent capture records (title, URL, timestamp) |
| `capture-count-YYYY-MM-DD` | Daily capture counter (keyed by date) |

## Related Docs

- [Capturing Content](./capturing.md)
- [Extension Settings](./settings.md)
- [BYOK Setup](../../getting-started/byok-setup.md)
