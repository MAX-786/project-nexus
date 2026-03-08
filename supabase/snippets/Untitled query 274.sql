-- Memory Consolidation: Stores cross-cutting insights discovered across nodes.
-- Inspired by the always-on memory agent pattern (periodic sleep-cycle consolidation).

CREATE TABLE public.consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_node_ids UUID[] NOT NULL,
  summary TEXT NOT NULL,
  insight TEXT NOT NULL,
  themes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consolidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consolidations"
  ON public.consolidations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consolidations"
  ON public.consolidations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consolidations"
  ON public.consolidations FOR DELETE USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX consolidations_user_id_idx ON public.consolidations (user_id);

-- Index for ordering by creation time
CREATE INDEX consolidations_created_at_idx ON public.consolidations (created_at DESC);
