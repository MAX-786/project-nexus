---
sidebar_position: 5
---

# Collections

Collections let you organise captured nodes into named groups for easier management and bulk operations.

## Data Model

Collections use two database tables:

```sql
collections (
  id uuid,
  user_id uuid,     -- RLS enforced
  name text,
  description text
)

collection_nodes (
  collection_id uuid,
  node_id uuid
)
```

A node can belong to **multiple collections**. The `collection_nodes` table is a many-to-many join.

## Creating a Collection

Collections can be created two ways:

1. **From the Feed**: Select nodes in bulk, click the Tag icon, then type a new collection name and click "Create".
2. **From the Collection Dialog**: The same dialog allows creating a new collection even if no nodes are currently selected.

## Adding Nodes to a Collection

1. Select one or more node checkboxes in the Feed.
2. Click the **Tag** (collection) icon in the bulk action toolbar.
3. The **Collection Tagger Dialog** opens, listing your existing collections.
4. Click a collection to toggle the selected nodes into it.
5. Click **"Add to Collection"** to save.

## Bulk Delete

When multiple nodes are selected in the Feed, the bulk action toolbar shows a **Delete** button. Clicking it permanently deletes all selected nodes and their associated data.

## Collection Tagger Dialog

The dialog (`collection-tagger-dialog.tsx`) shows:
- A scrollable list of existing collections with checkboxes.
- A text input for creating a new collection by name.
- A "Create" button to add the new collection to the list immediately.
- An "Add to Collection" confirm button.

## Removing Nodes from Collections

Node removal from a collection is done through the individual node detail view or through the collections management interface.
