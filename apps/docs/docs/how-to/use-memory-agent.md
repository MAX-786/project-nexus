---
sidebar_position: 4
---

# How to Use the Memory Agent

The Memory Agent is an AI-powered background process that analyses your captured nodes and synthesises overarching themes and cross-cutting insights into **consolidations**. Think of it as your second brain forming long-term memories.

## Prerequisites

- At least a few captured nodes in your database.
- A Memory Agent API key configured in Settings (see [BYOK Setup](../getting-started/byok-setup.md#memory-agent-keys)).

## Configure the Memory Agent

1. Open the **Settings** tab in the web dashboard.
2. Scroll to the **Memory Agent** section.
3. Choose your **Provider** (OpenAI or Gemini).
4. Enter your **API Key** for that provider.
5. Choose your **Model** from the available options.
6. Set the **Mode**:
   - **Auto** — the agent runs consolidations in the background automatically when you visit the Memory tab.
   - **Manual** — you trigger consolidations yourself with the "Consolidate" button.

## Running a Consolidation

### Auto Mode

Navigate to the **Memory** tab. The agent will automatically process unconsolidated nodes and generate insights.

### Manual Mode

1. Navigate to the **Memory** tab.
2. Click the **"Consolidate"** button.
3. The agent analyses your unconsolidated nodes and generates a new consolidation entry.

## Reading Consolidations

Each consolidation card shows:
- **Themes** — a list of overarching topic tags extracted from the consolidated nodes.
- **Insight** — the AI's synthesis of patterns and connections across the source nodes.
- **Summary** — a concise summary of the consolidated knowledge.
- **Source Nodes** — the number of nodes that contributed to this insight.
- **Timestamp** — when the consolidation was created.

## Querying Your Knowledge

The Memory tab provides a **BYOK query interface**:

1. Type a question in the query input (e.g., "What have I learned about machine learning?").
2. The query is sent directly to your LLM provider along with your recent consolidations as context.
3. The AI responds with an answer grounded in your actual captured knowledge.

## Pending Consolidation Counter

The Memory tab header shows:
- The total number of insights discovered so far.
- The number of nodes **pending consolidation** (nodes not yet included in any consolidation).

## Tips

- Consolidations work best when you have **10 or more nodes** covering related topics.
- Use **Manual mode** if you want to control when processing happens (saves API credits).
- Use **Auto mode** for a seamless "always-on" experience.
