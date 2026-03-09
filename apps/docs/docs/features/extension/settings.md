---
sidebar_position: 3
---

# Extension Settings

The Extension Options page is accessed by clicking the gear icon in the popup or right-clicking the extension icon → "Options".

## AI Provider Configuration

The extension supports three LLM providers. You can enter keys for all three, but only the **active provider** is used for captures.

| Provider | Model | Key Field |
|---|---|---|
| **OpenAI** | GPT-4o mini | `openai-key` |
| **Anthropic** | Claude 3.5 | `anthropic-key` |
| **Gemini** | Gemini 2.5 Flash | `gemini-key` |

### Setting Your Active Provider

Click the provider button (OpenAI / Anthropic / Gemini) to set it as the active provider. The active provider is highlighted.

### Key Visibility Toggle

Each key field has a show/hide toggle (eye icon) so you can verify the key you've entered without exposing it by default.

## Supabase JWT

The **Supabase JWT** field stores your session token for database access.

- Obtain the token from the web dashboard: **Settings → Extension Authentication → Copy JWT Token**.
- Paste it into this field.
- JWTs expire after approximately 1 hour; you must refresh this periodically.

:::tip Refresh JWT Easily
Keep the Settings tab open in the web dashboard so you can quickly copy a fresh JWT when needed.
:::

## Storage

All values are stored using [Plasmo Storage](https://docs.plasmo.com/framework/storage) (`@plasmohq/storage`), which wraps `chrome.storage.local`. Keys are scoped to the extension origin and are not accessible by web pages.
