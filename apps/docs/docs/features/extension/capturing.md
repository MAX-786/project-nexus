---
sidebar_position: 2
---

# Capturing Content

The extension's primary function is to capture web content and process it with AI.

## Supported Content Types

| Content Type | Source | Method |
|---|---|---|
| **Articles** | Any web page with `<article>` element | DOM text extraction |
| **YouTube Videos** | YouTube.com pages | Transcript extraction from captions |

## Capture Status States

The popup displays one of these status states during capture:

| Status | Description |
|---|---|
| `idle` | Ready to capture. |
| `extracting` | Extracting text content from the page. |
| `processing` | Calling the LLM API to generate summary and entities. |
| `done` | Capture complete. Node saved to database. |
| `error` | Something went wrong. Error message is displayed. |
| `jwt_expired` | The Supabase session has expired. Click Sign In in the popup. |

## AI Processing Output

The LLM call produces a structured JSON response:

```json
{
  "summary": "A concise 2-3 sentence summary of the content.",
  "entities": [
    { "name": "React", "type": "tool" },
    { "name": "Dan Abramov", "type": "person" },
    { "name": "Component Architecture", "type": "concept" }
  ]
}
```

This data is saved to the `nodes` table (summary) and `entities` table.

## Daily Capture Counter

The popup header displays how many items you have captured today. The counter:
- Resets at midnight local time.
- Is stored with a date key in local storage.
- Is shown as a badge on the extension icon (if supported by the browser).

## Capture History

The popup shows a scrollable list of your recent captures. Each entry displays:
- Page title.
- Source URL (truncated).
- Capture timestamp.

This is a local-only display from storage — it does not load from the database.

## Authentication Status

The extension monitors your Supabase session and displays your authentication status in the popup. If you are not authenticated, you will see a **Sign In** button. Once signed in, your session automatically refreshes.

When signed out, captures will fail with a "Not authenticated" error. Click **Sign In** from the extension popup to reconnect to your dashboard session.
