---
name: nexus-supabase-db
description: Rules for interacting with Supabase, PostgreSQL Row Level Security (RLS), and pgvector for AI embeddings in Project Nexus. Use this when writing database queries, SQL migrations, or vector similarity search logic.
---

# Supabase & Database Guidelines

## Row Level Security (RLS) - CRITICAL
1. Every table MUST have RLS enabled.
2. Write policies ensuring users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows where the `user_id` matches `auth.uid()`. 
3. Never bypass RLS using the Supabase Service Role Key on the client side.

## Vector Search (`pgvector`)
1. The `nodes` table contains an `embedding` column of type `vector(1536)` (optimized for OpenAI/standard embedding dimensions).
2. When querying for similar nodes to build the Knowledge Graph, use the Cosine Distance operator (`<=>`).
3. Create a Postgres function named `match_nodes` that accepts a query embedding and a similarity threshold (e.g., `0.8`), returning the matching records.

## Spaced Repetition Logic (SuperMemo-2)
- The `reviews` table tracks the memory states.
- When updating a review, calculate the new `interval` and `ease_factor` purely in TypeScript utility functions, then push the resulting `next_review_date` to Supabase.
- Always fetch records where `next_review_date <= CURRENT_DATE` ordered by the oldest dates first.