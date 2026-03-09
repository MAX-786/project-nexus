---
sidebar_position: 6
---

# How to Search Your Knowledge

Project Nexus provides a command-search interface for quickly finding nodes across your entire knowledge base.

## Opening Search

Press **`Cmd+K`** (Mac) or **`Ctrl+K`** (Windows/Linux) from anywhere in the dashboard to open the command search palette.

Alternatively, click the **search icon** in the dashboard navigation bar.

## Search Scope

The search runs a **hybrid search** across:
- Node **titles**
- Node **summaries**
- **Entity names** (people, tools, concepts) attached to nodes

## Using the Search

1. Type your query in the search input.
2. Results appear in real time as you type.
3. Click a result to navigate to that node in the Feed and open its detail view.

## Search Tips

- Search for **entity names** to find all nodes that mention a specific person, tool, or concept.
- Use **partial matches** — the search is not case-sensitive and matches substrings.
- Short queries (2–3 words) often return more relevant results than long natural-language sentences.

## Semantic Search

The database supports **hybrid search** via the `search_nodes_hybrid` function, which combines:
- **Full-text search** on title and summary.
- **Vector similarity search** using `pgvector` embeddings.

This means results include both exact keyword matches and semantically related content.
