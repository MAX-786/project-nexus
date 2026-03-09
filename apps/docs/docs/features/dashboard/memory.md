---
sidebar_position: 4
---

# Memory Agent

The Memory tab provides AI-powered knowledge consolidation and a conversational query interface over your captured knowledge.

## What Is a Consolidation?

A **consolidation** is an AI-generated insight that synthesises patterns and connections across multiple captured nodes. It is stored in the `consolidations` table.

Each consolidation contains:
- **Summary** — a prose summary of the consolidated knowledge.
- **Insight** — a specific cross-cutting observation or pattern the AI found.
- **Themes** — a list of topic tags extracted from the source nodes.
- **Source Node IDs** — references to the nodes that contributed to this consolidation.

## Memory Tab Layout

The Memory tab has two sections:

### 1. Consolidation Panel

Displays your existing consolidation cards, sorted by most recent. Each card shows:
- Themes as badges.
- The insight text.
- A summary.
- The number of source nodes.
- Timestamp.

### 2. Query Interface

A text input at the bottom of the page for asking questions. When you submit a query:
1. Your consolidations (and optionally recent nodes) are included as context.
2. The query is sent directly to your configured LLM provider (BYOK — never through our servers).
3. The AI's response appears inline.

## Unconsolidated Node Counter

The header shows `N nodes pending consolidation`. These are nodes not yet referenced in any consolidation entry. A high number indicates the agent has new material to process.

## Unique Themes

The agent collects all unique themes across all consolidations and makes them available as filter tags.

## Configuration

Memory Agent settings live in the **Settings tab** under the "Memory Agent" section:

| Setting | Options |
|---|---|
| **Provider** | OpenAI, Gemini |
| **API Key** | Stored in browser localStorage |
| **Mode** | Auto, Manual |
| **Model** | Varies by provider |

Settings are persisted via **Zustand** with `localStorage` persistence (storage key: `nexus-memory-settings`).

## Auto vs. Manual Mode

| Mode | Behaviour |
|---|---|
| **Auto** | Consolidations run automatically when you open the Memory tab and new unconsolidated nodes are present. |
| **Manual** | You must click the "Consolidate" button to trigger the process. |

## Database Table

```sql
consolidations (
  id uuid,
  user_id uuid,           -- RLS enforced
  source_node_ids uuid[], -- array of contributing node IDs
  summary text,
  insight text,
  themes text[],          -- array of theme tags
  created_at timestamptz
)
```
