-- Add is_bookmarked column to nodes table
ALTER TABLE public.nodes ADD COLUMN is_bookmarked BOOLEAN NOT NULL DEFAULT false;

-- Index for fast bookmark filtering
CREATE INDEX idx_nodes_bookmarked ON public.nodes (user_id, is_bookmarked) WHERE is_bookmarked = true;
