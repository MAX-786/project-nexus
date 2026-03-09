---
sidebar_position: 3
---

# Your First Capture

Once the extension is installed and your BYOK keys are configured, you are ready to capture your first piece of knowledge.

## Capture an Article

1. Navigate to any article or blog post in Chrome.
2. Click the **Nexus icon** in the toolbar.
3. Click the **"Capture"** button in the popup.
4. The extension will:
   - Scrape the main article text from the page.
   - Call your LLM API to generate a summary and extract entities (people, tools, concepts).
   - Save the node to your Supabase database.
   - Generate a text embedding and auto-link it to related existing nodes.

The popup displays a progress indicator with the current step (e.g., "Extracting content…", "Processing with AI…", "Saving to database…").

## Capture a YouTube Video

1. Navigate to any YouTube video that has captions enabled.
2. Click the Nexus icon and then **"Capture"**.
3. The extension extracts the video transcript from the page, then processes it the same way as an article.

:::note No Transcript Available
If a YouTube video has no captions, the extension will display an error: **"No transcript available to capture."** This is expected — the video cannot be processed without text content.
:::

## View Your Capture in the Dashboard

After a successful capture:

1. Open the [web dashboard](http://localhost:3000/dashboard).
2. Your new node appears at the top of the **Feed** list on the left panel.
3. If it shares semantic similarity with any existing nodes (cosine similarity > 0.8), edges are automatically created and visible in the **Graph** tab.

## The Capture Counter

The extension popup header shows a **daily capture count** badge (e.g., "3 today"). This resets at midnight local time.

## Capture History

The extension popup also shows a short list of your recent captures with their titles. Clicking on a history item does not navigate anywhere — it's a quick reference for what you've captured.

## Next Steps

- [Build your Knowledge Graph](../how-to/build-your-knowledge-graph.md)
- [Review your captured knowledge](../how-to/use-spaced-repetition.md)
- [Use the Memory Agent](../how-to/use-memory-agent.md)
