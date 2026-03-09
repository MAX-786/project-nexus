---
sidebar_position: 2
---

# How to Build Your Knowledge Graph

The Knowledge Graph is a 2D visual canvas that shows how your captured nodes relate to each other. Connections (edges) are created automatically based on semantic similarity, or manually by you.

## Automatic Edge Creation

Every time you capture a new node, Project Nexus:

1. Generates a text embedding (vector) for the node's content.
2. Queries the database for existing nodes with a cosine similarity score above **0.8**.
3. Automatically creates edges between the new node and its semantic neighbors.

You do not need to do anything for this to work — just keep capturing.

## Viewing the Graph

1. Navigate to the **Graph** tab in the dashboard.
2. The canvas renders all your nodes as draggable bubbles connected by edges.
3. Use **scroll to zoom** and **click-drag to pan**.

## Navigating Large Graphs

When you have many nodes, the graph renders a **local cluster** by default:
- Only nodes within **2 degrees of separation** from the selected node are shown.
- This prevents performance issues with large graphs (threshold: 500+ nodes).

To change the focus cluster, click any node in the graph to select it.

## Inspecting a Node

Click any node in the graph to open the **Node Inspector** panel on the right side. It shows:
- The node's title and URL.
- The AI-generated summary.
- Entity tags attached to the node.
- All connected edges (with edge labels where available).
- Buttons to open the original URL or delete the node.

## Creating Manual Edges

You can draw a connection between any two nodes manually:

1. In the Graph tab, switch to **Link mode** by clicking the **Link** icon in the toolbar.
2. Click the **source** node.
3. Click the **target** node.
4. The edge is created and labelled as a manual link.

## Deleting a Manual Edge

1. Select the manual edge you want to remove by clicking it.
2. Click the **Delete Edge** option that appears in the inspector or toolbar.

:::note
Automatic (AI-generated) edges cannot be manually deleted. Only edges created in Link mode can be removed.
:::

## Graph Toolbar

| Tool | Description |
|---|---|
| **Select** (cursor) | Click nodes to inspect them; drag to pan. |
| **Link** (chain icon) | Click two nodes to create a manual edge between them. |
| **Controls** | Zoom in/out, fit view, lock/unlock node positions. |
| **MiniMap** | Overview of the full graph. Click to navigate. |
