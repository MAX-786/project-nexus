---
sidebar_position: 2
---

# Database Schema

Project Nexus uses **Supabase (PostgreSQL)** with the **`pgvector`** extension. Row Level Security (RLS) is enabled on every table.

The full initialisation script is at `supabase_setup.sql` in the project root. Incremental migrations are in `supabase/migrations/`.

---

## Tables

### `users`

Extends Supabase Auth users. Automatically created on signup via a trigger.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. References `auth.users(id)`. |
| `email` | `text` | User's email address. |
| `tier` | `text` | Subscription tier: `free`, `cloud`, or `pro`. Default: `free`. |

**RLS**: Users can only read and update their own row.

---

### `nodes`

The primary content table. Each row is a captured article or video.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner. References `users(id)`. |
| `url` | `text` | Source URL. |
| `title` | `text` | Page title. |
| `summary` | `text` | AI-generated summary. |
| `raw_text` | `text` | The original scraped text. Loaded lazily. |
| `embedding` | `vector(1536)` | Text embedding for semantic search. |
| `created_at` | `timestamptz` | Capture timestamp. |

**RLS**: Users can read, insert, update, and delete only their own nodes.

---

### `entities`

AI-extracted concepts, people, and tools from captured nodes.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner. |
| `node_id` | `uuid` | Parent node. Cascade deletes on node deletion. |
| `name` | `text` | Entity name (e.g., "React", "Dan Abramov"). |
| `type` | `text` | Entity type: `person`, `concept`, or `tool`. |

**RLS**: Users can manage only their own entities.

---

### `edges`

Relationships between nodes. Can be AI-generated (vector similarity) or manually created.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `source_id` | `uuid` | Source node. Cascade deletes on node deletion. |
| `target_id` | `uuid` | Target node. Cascade deletes on node deletion. |
| `user_id` | `uuid` | Owner. |
| `relation_type` | `text` | Type of relationship (e.g., `semantic_similarity`, `manual`). |
| `weight` | `float` | Edge weight / similarity score. Default: `1.0`. |
| `is_manual` | `boolean` | `true` for user-created edges. Default: `false`. |
| `label` | `text` | Optional display label for the edge. |

**Constraint**: Unique index on `(source_id, target_id, user_id)` prevents duplicate edges.
**RLS**: Users can manage only their own edges.

---

### `reviews`

Spaced repetition tracking for each node.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner. |
| `node_id` | `uuid` | The node being reviewed. |
| `next_review_date` | `date` | When this node is next due for review. |
| `interval` | `integer` | Current interval in days. |
| `ease_factor` | `numeric` | SM-2 ease factor. Default: `2.5`. |

**RLS**: Users can manage only their own review records.

---

### `collections`

User-defined named groups for organising nodes.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner. |
| `name` | `text` | Collection name. |
| `color` | `text` | Optional display colour. |
| `created_at` | `timestamptz` | Creation timestamp. |

**RLS**: Users can manage only their own collections.

---

### `node_collections`

Many-to-many join table between nodes and collections.

| Column | Type | Description |
|---|---|---|
| `node_id` | `uuid` | References `nodes(id)`. Cascade deletes. |
| `collection_id` | `uuid` | References `collections(id)`. Cascade deletes. |
| `created_at` | `timestamptz` | When the node was added to the collection. |

**Primary Key**: `(node_id, collection_id)`
**RLS**: A user can manage a `node_collection` row if they own the referenced collection.

---

### `consolidations`

AI-generated knowledge insights synthesised from multiple nodes by the Memory Agent.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | Owner. |
| `source_node_ids` | `uuid[]` | Array of node IDs that contributed to this insight. |
| `summary` | `text` | Prose summary of the consolidated knowledge. |
| `insight` | `text` | The AI's specific cross-cutting observation. |
| `themes` | `text[]` | Array of topic tags. Default: `{}`. |
| `created_at` | `timestamptz` | Creation timestamp. |

**Indexes**: `consolidations_user_id_idx`, `consolidations_created_at_idx`
**RLS**: Users can select, insert, and delete only their own consolidations.

---

## Functions

### `search_nodes_hybrid(query_text, query_embedding, match_count, user_id)`

Performs a hybrid search combining full-text search and vector similarity on the `nodes` table.

Defined in `supabase/migrations/20240306232702_search_nodes_hybrid.sql`.

---

## Migrations

| Migration File | Description |
|---|---|
| `20240101000000_init.sql` | Initial schema (nodes, entities, edges, reviews, users). |
| `20240306232702_search_nodes_hybrid.sql` | Hybrid search function. |
| `20260304164808_fix_auth_users.sql` | Auth user schema fixes. |
| `20260305000000_add_performance_indexes.sql` | Performance indexes on nodes and edges. |
| `20260306000000_add_manual_edges.sql` | `is_manual` and `label` columns on `edges`. |
| `20260307000000_add_collections.sql` | `collections` and `node_collections` tables. |
| `20260308000000_add_consolidations.sql` | `consolidations` table for Memory Agent. |
