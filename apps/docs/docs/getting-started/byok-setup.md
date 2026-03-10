---
sidebar_position: 2
---

# BYOK Setup

Project Nexus uses a **Bring Your Own Key (BYOK)** model for all AI features on the free tier. Your API keys are stored locally in your browser and are never sent to our servers.

## Supported Providers

| Provider | Model Used | Use Case |
|---|---|---|
| **OpenAI** | GPT-4o mini | Summarization, entity extraction, embeddings |
| **Anthropic** | Claude 3.5 | Summarization, entity extraction |
| **Gemini** | Gemini 2.5 Flash | Summarization, entity extraction, memory agent |

## Step 1: Get an API Key

Obtain an API key from your chosen provider:

- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **Google Gemini**: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Step 2: Open Extension Settings

1. Click the **Nexus icon** in your Chrome toolbar.
2. Click the **⚙️ gear icon** (or "Options") in the extension popup to open the settings page.

## Step 3: Enter Your API Key

On the Extension Options page:

1. Select your **AI Provider** (OpenAI, Anthropic, or Gemini).
2. Paste your API key into the corresponding input field.
3. The key is saved automatically to browser local storage — no submit button needed.

## Step 4: Connect Extension

The extension needs to link to your Supabase session to save captured data to your database. We use a seamless one-click authentication flow:

1. Click the **Nexus icon** in your Chrome toolbar.
2. In the popup, click the **Sign In** button (or go to **Settings → Extension Authentication** in the web dashboard and click **Connect Extension**).
3. The extension will open a new tab to authenticate automatically.
4. Once connected, your session is synced and will refresh automatically. You don't need to manually copy or paste any tokens.

## How BYOK Works

```
Your Browser Extension
  ↓ (API key from local storage)
  → Direct API call to OpenAI / Anthropic / Gemini
  ← Structured JSON response (summary, entities)
  → Supabase (your database)
```

No data passes through Project Nexus servers. The Vercel-hosted dashboard only reads from your Supabase database — it never sees your API keys.

## Memory Agent Keys

The Memory Agent can be configured with a separate API key. Configure it in the **Web Dashboard** under **Settings → Memory Agent**:

- **Provider**: Select OpenAI or Gemini.
- **API Key**: Enter your key (stored in browser local storage via Zustand).
- **Mode**: Choose between:
  - **Auto** — the agent runs consolidations automatically.
  - **Manual** — you trigger consolidation yourself from the Memory tab.

See [Using the Memory Agent](../how-to/use-memory-agent.md) for details.
