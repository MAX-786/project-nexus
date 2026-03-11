-- Migration: Add performance indexes for analytics and common query patterns
-- Issue #77: Performance & Caching Optimizations

-- Indexes for nodes table
CREATE INDEX IF NOT EXISTS idx_nodes_user_created ON public.nodes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_user_bookmarked ON public.nodes(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;

-- Indexes for entities table
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON public.entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_node_id ON public.entities(node_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(user_id, entity_type);

-- Indexes for edges table
CREATE INDEX IF NOT EXISTS idx_edges_user_id ON public.edges(user_id);
CREATE INDEX IF NOT EXISTS idx_edges_source ON public.edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON public.edges(target_id);

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_user_due ON public.reviews(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_reviews_user_reviewed ON public.reviews(user_id, last_reviewed_at DESC);

-- Indexes for collections table
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);

-- Indexes for node_collections junction
CREATE INDEX IF NOT EXISTS idx_node_collections_node ON public.node_collections(node_id);
CREATE INDEX IF NOT EXISTS idx_node_collections_collection ON public.node_collections(collection_id);

-- Indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- Indexes for node_tags junction
CREATE INDEX IF NOT EXISTS idx_node_tags_node ON public.node_tags(node_id);
CREATE INDEX IF NOT EXISTS idx_node_tags_tag ON public.node_tags(tag_id);
