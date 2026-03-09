---
sidebar_position: 6
---

# Settings

The Settings page (`/dashboard/settings`) lets you configure your profile, appearance, Memory Agent, and account management.

## Sections

### Profile

Displays your account email address.

### Appearance

Toggle between **Light** and **Dark** themes. The theme is applied globally and persisted via `next-themes` with `localStorage`.

### Memory Agent

Configure the AI provider and mode for the [Memory Agent](./memory.md).

| Field | Description |
|---|---|
| **Provider** | Select OpenAI or Gemini. |
| **API Key** | Enter your key for the selected provider. Stored in browser localStorage. |
| **Mode** | Toggle between **Auto** and **Manual** consolidation. |
| **Model** | Select the specific model to use (options depend on provider). |

### Extension Authentication

This section is for linking the browser extension to your dashboard session.

1. Click **"Copy JWT Token"** to copy your current Supabase session token.
2. Paste the token into the **Supabase JWT** field in the extension's Options page.

:::info JWT Lifetime
Supabase session tokens expire after approximately 1 hour. You will need to refresh the token in the extension when it expires.
:::

### Danger Zone

The Danger Zone section contains the **Delete Account** action.

:::danger Delete Account
Clicking "Delete Account" will permanently delete:
- All your captured nodes.
- All entities, edges, and review records.
- Your Supabase auth account.

This action cannot be undone.
:::

The deletion sequence follows dependency order: `reviews → edges → entities → nodes` to respect foreign key constraints, then deletes the auth user and signs out.
