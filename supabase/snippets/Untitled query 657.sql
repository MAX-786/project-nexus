-- Migration: Add performance indexes for common query patterns
-- Related Issue: https://github.com/MAX-786/project-nexus/issues/41

-- Enable pg_trgm for trigram-based fuzzy search on entity names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fast entity name lookups and filtering (supports LIKE / ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_entities_name ON public.entities USING GIN (name gin_trgm_ops);

-- Fast chronological feed sorting (user-scoped, newest first)
CREATE INDEX IF NOT EXISTS idx_nodes_created_at ON public.nodes (user_id, created_at DESC);

-- Fast edge lookups for graph rendering
CREATE INDEX IF NOT EXISTS idx_edges_source ON public.edges (source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON public.edges (target_id);

-- Fast review queue lookups (spaced repetition scheduling)
CREATE INDEX IF NOT EXISTS idx_reviews_next_date ON public.reviews (user_id, next_review_date);
