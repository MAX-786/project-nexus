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

### Keyboard Shortcuts

Enable or disable the comprehensive dashboard keyboard shortcuts globally. If enabled, you can customize the individual key bindings for navigation (e.g., Go to Feed, Go to Graph) and actions (e.g., Toggle Bookmark, Delete Node, J/K feed navigation) by recording new keystrokes here. These preferences are stored in the database and synced across your devices.

### Extension Authentication

This section is for linking the browser extension to your dashboard session.

Click **Connect Extension** to securely sync your current Supabase session to the extension. The session uses both access and refresh tokens, so it will refresh automatically without any manual copying or pasting.

### Danger Zone

The Danger Zone section contains the **Delete Account** action.

:::danger Delete Account
Clicking "Delete Account" will permanently delete:
- All your captured nodes.
- All entities, edges, and review records.
- Your Supabase auth account.

This action cannot be undone.
:::

The deletion sequence follows dependency order: `reviews → highlights → edges → entities → nodes → consolidations → tags → collections → user_settings → users` to respect foreign key constraints and ensure a clean wipe, then signs out the user.
