---
sidebar_position: 1
---

# How to Capture Your First Article

A practical, step-by-step guide to capturing your first article into Project Nexus.

## What You Need

- Extension installed and loaded in Chrome (see [Installation](../getting-started/installation.md)).
- At least one BYOK API key configured (see [BYOK Setup](../getting-started/byok-setup.md)).
- A Supabase JWT token entered in the extension options.

## Steps

### 1. Find an Article to Capture

Open any article page — a blog post, a news article, documentation, or a research paper. The extension works best on pages where the main content is wrapped in an `<article>` HTML element.

### 2. Open the Extension Popup

Click the **Nexus icon** in your Chrome toolbar. You will see:
- Your daily capture count.
- A **Capture** button.
- A short history of your recent captures.

### 3. Click "Capture"

Click the **Capture** button. The popup status indicator will cycle through:

1. **Extracting content…** — scraping the article text from the DOM.
2. **Processing with AI…** — calling your LLM API to generate a summary and extract entities.
3. **Saving to database…** — storing the node and creating vector-similarity edges.
4. **Done!** ✅ — The capture is complete.

### 4. View in the Dashboard

Open the Project Nexus dashboard (`http://localhost:3000/dashboard`). Your article appears at the top of the **Feed** with:
- The page title.
- An AI-generated summary.
- Entity tags (people, tools, concepts).
- Timestamp.

## Troubleshooting

| Problem | Solution |
|---|---|
| "Not authenticated" error | Your JWT has expired. Refresh it from **Settings → Extension Authentication**. |
| "No content extracted" | The page may not have a standard `<article>` element. Try a different article. |
| Capture button is greyed out | Check that your API key and JWT are entered in the extension options. |
| AI processing error | Verify your API key is valid and has sufficient quota. |
