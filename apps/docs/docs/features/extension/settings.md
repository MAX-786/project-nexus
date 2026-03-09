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

## Account Authentication

The **Account** section in the Options page shows your current sign-in status and lets you sign in or out.

### Signing In (One-Click Flow)

1. Open the extension **Options** page (or click **Sign In with Nexus** in the popup).
2. Click **Sign In with Nexus →**.
3. A new tab opens at **`/auth/extension`** on the Nexus web app.
4. If you're already signed in to the web app, your session is synced to the extension automatically.
5. If you're not signed in, complete the login form and the session is synced immediately.
6. The tab shows a success message and closes itself.

The extension now uses a full Supabase session (access token + refresh token). Tokens **refresh automatically** — you never need to copy or paste anything.

### Signing Out

Click **Sign Out** in the Options page to revoke the extension's session. Your API keys remain stored.

## Storage

All values are stored using [Plasmo Storage](https://docs.plasmo.com/framework/storage) (`@plasmohq/storage`), which wraps `chrome.storage.local`. Keys are scoped to the extension origin and are not accessible by web pages.
