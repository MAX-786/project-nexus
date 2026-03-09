---
sidebar_position: 5
---

# How to Manage Collections

Collections let you group captured nodes into named sets for easy organisation and bulk operations.

## Creating a Collection

1. In the **Feed** tab, select one or more nodes by clicking their checkboxes (bulk select mode activates automatically when you click any checkbox).
2. Click the **Tag** icon (or "Add to Collection") in the bulk action bar that appears.
3. In the dialog that opens:
   - **Select an existing collection** from the list, or
   - **Create a new collection** by typing a name in the input and clicking "Create".
4. Click **"Add to Collection"** to confirm.

## Viewing Collection Contents

Collections are currently managed from the Feed. When filtering by collection:
1. Use the collection filter dropdown in the Feed toolbar (if available in your version).
2. Only nodes belonging to that collection will be displayed.

## Bulk Operations

When multiple nodes are selected in the Feed:

| Action | How to Trigger |
|---|---|
| **Add to Collection** | Click the Tag icon in the bulk action toolbar. |
| **Bulk Delete** | Click the Delete icon in the bulk action toolbar. |

:::warning Bulk Delete
Bulk deleting nodes is irreversible. All entities, edges, and review records for the selected nodes will also be deleted.
:::

## Removing Nodes from a Collection

Individual node removal from a collection can be done via the node's detail panel. Click the node in the Feed to open its details and look for the collection management options.

## Tips

- Use collections to group nodes by project, topic, or time period.
- Create a collection called "Read Later" to flag nodes for follow-up.
- Collections persist in your Supabase database and sync across devices.
