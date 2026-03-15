---
sidebar_position: 2
---

# Knowledge Graph

The Knowledge Graph is a 2D interactive canvas that visualises the relationships between your captured nodes.

## Technology

Built with **[@xyflow/react](https://reactflow.dev/)** (React Flow), the graph renders nodes as draggable bubbles and edges as connecting lines. The `ReactFlowProvider` wrapper enables use of the `useReactFlow` hook for programmatic control.

## Graph Nodes

Each node in the graph represents a captured piece of knowledge. The visual node shows:
- The node title (truncated).
- An icon indicating the content type.
- A colour indicating whether the node has been reviewed or not.

## Graph Edges

| Edge Type | Description | Colour |
|---|---|---|
| **AI-generated** | Created automatically based on vector similarity (cosine > 0.8). Lines are **weight-scaled** based on the relationship strength. | Default |
| **Manual** | Created by the user in Link mode. | Highlighted |

Manual edges can have custom labels.

## Visual Enhancements & Filtering

- **Entity Colors**: Node bubbles are color-coded based on the primary entities they contain (e.g., people, tools, concepts).
- **Focus Mode**: Click the focus icon to declutter the graph, isolating the selected node and its most relevant connections.
- **Filtering**: A robust filtering bar allows you to hide or show nodes by tags, collections, or reviews.
- **Cluster Layout**: Nodes use a physics-based cluster layout to automatically visually group tightly related concepts together on the canvas.

## Performance: Local Cluster View

For graphs with more than **500 nodes**, the graph automatically switches to a **local cluster view**:
- Uses a **BFS (Breadth-First Search)** algorithm (implemented in `apps/web/src/lib/graph-cluster.ts`).
- Default cluster depth: **2 degrees of separation** from the selected node.
- Only the nodes and edges within the cluster are rendered, preventing performance degradation.

## Controls

| Action | Method |
|---|---|
| **Pan** | Click and drag on the canvas background. |
| **Zoom** | Scroll wheel, or use the +/- controls. |
| **Select node** | Click a node bubble. |
| **Fit view** | Click the "Fit View" button in the Controls panel. |
| **Lock positions** | Click the lock icon to prevent nodes from moving. |

## Node Inspector Panel

Clicking a node opens an inspector panel (slide-out Sheet) on the right:
- **Title and URL** — with a link to the original source.
- **Summary** — the AI-generated summary.
- **Entities** — tagged people, tools, and concepts.
- **Connected Edges** — list of all edges for this node, with the related node titles.
- **Actions** — Delete node, open URL.

## Manual Edge Creation

1. Click the **Link** toolbar icon to enter Link mode.
2. Click the **source** node.
3. Click the **target** node.
4. The edge is drawn and saved to the database.

## Manual Edge Deletion

1. Select a manual edge by clicking it.
2. Click the **Delete** option in the inspector or press the Delete key.

:::note
AI-generated edges are read-only and cannot be deleted manually.
:::

## Toolbar Modes

| Mode | Icon | Behaviour |
|---|---|---|
| **Select** | Cursor | Default interaction mode. |
| **Link** | Chain | Creates a manual edge between two clicked nodes. |
