---
sidebar_position: 1
---

# The Feed

The Feed is the primary view for browsing your captured knowledge. It displays all your nodes in reverse-chronological order.

## Layout

The dashboard uses a **split-panel layout**:
- **Left panel** — the Feed list.
- **Right panel** — the selected node detail, or the Knowledge Graph, depending on the active tab.

## Feed List

Each node card in the Feed shows:
- **Title** — the page title from the captured URL.
- **Summary** — the first few lines of the AI-generated summary.
- **Entity tags** — extracted people, tools, and concepts.
- **Source URL** — a truncated link to the original page.
- **Timestamp** — when the node was captured.

## Virtualized Rendering

The Feed uses **[@tanstack/react-virtual](https://tanstack.com/virtual/latest)** with dynamic row height measurement (`measureElement`). This ensures smooth scrolling performance even with tens of thousands of nodes. Only the visible rows (plus an overscan of 5 above and below) are rendered in the DOM at any time.

## Viewing Full Content

Click any node card to open its **detail view** in the right panel. The detail view loads the full `raw_text` lazily (only fetched when the node is selected, not during the initial Feed load) to keep initial page loads fast.

## Searching

Use **Cmd+K / Ctrl+K** or the search icon to open the command search palette. See [Search Your Knowledge](../../how-to/search-your-knowledge.md).

## Bulk Operations

Activate bulk selection mode by clicking the checkbox on any node card. Once active:

- **Checkboxes** appear on all node cards.
- A **bulk action toolbar** appears at the bottom of the Feed.
- Available bulk actions:
  - **Add to Collection** — assign all selected nodes to a collection.
  - **Delete** — permanently delete all selected nodes and their associated data.

## Single Node Deletion

Click the **⋮ menu** on a node card and select "Delete" to delete a single node. This removes:
- The node itself.
- All attached entities.
- All edges connected to the node.
- The spaced repetition review record.

## Empty State

When no nodes have been captured yet, the Feed shows an **onboarding empty state** with instructions to install the extension and capture your first article.
