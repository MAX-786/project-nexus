-- Migration: Additional performance indexes for common query patterns
-- Extends 20260305000000_add_performance_indexes.sql with more targeted indexes.

-- Fast bookmark filtering (user's bookmarked nodes)
CREATE INDEX IF NOT EXISTS idx_nodes_bookmarked
  ON public.nodes (user_id, is_bookmarked)
  WHERE is_bookmarked = true;

-- Fast edge lookups by owner (used in feed + graph pages)
CREATE INDEX IF NOT EXISTS idx_edges_user_id
  ON public.edges (user_id);

-- Fast entity lookups by node (used when rendering node detail cards)
CREATE INDEX IF NOT EXISTS idx_entities_node_id
  ON public.entities (node_id);

-- Composite entity lookup: owner + node (most common join pattern)
CREATE INDEX IF NOT EXISTS idx_entities_user_node
  ON public.entities (user_id, node_id);

-- Fast consolidation listing (memory page, newest-first)
CREATE INDEX IF NOT EXISTS idx_consolidations_user_created
  ON public.consolidations (user_id, created_at DESC);

-- Fast review history queries (streak computation + heatmap)
CREATE INDEX IF NOT EXISTS idx_reviews_last_reviewed
  ON public.reviews (user_id, last_reviewed_at DESC)
  WHERE last_reviewed_at IS NOT NULL;

-- Fast node count per user (used in dashboard stats)
CREATE INDEX IF NOT EXISTS idx_nodes_user_id
  ON public.nodes (user_id);
