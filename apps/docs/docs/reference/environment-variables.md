---
sidebar_position: 1
---

# Environment Variables

All environment variables for Project Nexus. Copy `.env.example` to `.env.local` at the project root to get started.

```bash
cp .env.example .env.local
```

## Web Dashboard (`apps/web`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL (e.g., `https://[PROJECT_ID].supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | The Supabase anonymous (public) key from your project's API settings. |
| `NEXT_PUBLIC_SITE_URL` | ✅ | The base URL of the Next.js app. `http://localhost:3000` for local dev; your domain in production. |

## Browser Extension (`apps/extension`)

| Variable | Required | Description |
|---|---|---|
| `PLASMO_PUBLIC_SUPABASE_URL` | ✅ | Same as `NEXT_PUBLIC_SUPABASE_URL`. Plasmo requires the `PLASMO_PUBLIC_` prefix for client-accessible env vars. |
| `PLASMO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Same as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `PLASMO_PUBLIC_SITE_URL` | ✅ | Same as `NEXT_PUBLIC_SITE_URL`. |

## Server-Side AI Keys (Optional)

These are **not needed** for the standard BYOK free tier, where all AI calls happen client-side using keys stored in browser local storage.

They are only required if you are building server-side AI features (e.g., a managed hosting tier where the server routes AI requests).

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for server-side calls. |
| `ANTHROPIC_API_KEY` | Anthropic API key for server-side calls. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key for server-side calls. |

## BYOK Keys (Not in `.env`)

For the standard free tier, AI provider keys are stored in **browser local storage** (not in `.env` files):

| Storage Key | Provider |
|---|---|
| `openai-key` | OpenAI |
| `anthropic-key` | Anthropic |
| `gemini-key` | Google Gemini |
| `active-provider` | Selected provider (`openai` / `anthropic` / `gemini`) |
| `sb-*-auth-token` | Supabase session (managed automatically by Supabase SDK) |

These are set via the extension's Options page. See [BYOK Setup](../getting-started/byok-setup.md).
