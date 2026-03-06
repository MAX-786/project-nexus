-- Migration: Add support for manual edges in knowledge graph
-- Adds is_manual flag to edges table and a label column for user-provided descriptions

ALTER TABLE public.edges ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.edges ADD COLUMN IF NOT EXISTS label TEXT;

-- Allow manual edges to have a null weight (auto edges use similarity score)
-- No schema change needed since weight already allows NULL via DEFAULT 1.0

-- Index for filtering manual vs auto edges
CREATE INDEX IF NOT EXISTS idx_edges_is_manual ON public.edges (user_id, is_manual);

COMMENT ON COLUMN public.edges.is_manual IS 'True if the edge was manually created by the user, false if auto-generated via vector similarity';
COMMENT ON COLUMN public.edges.label IS 'Optional user-provided label describing the relationship';
