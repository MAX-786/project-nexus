-- Migration: Add daily_digests table for AI-generated daily summaries
-- Issue #72: AI-Powered Smart Daily Digest

CREATE TABLE IF NOT EXISTS public.daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  node_ids UUID[] NOT NULL DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own digests"
  ON public.daily_digests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own digests"
  ON public.daily_digests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own digests"
  ON public.daily_digests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own digests"
  ON public.daily_digests FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_daily_digests_user_id ON public.daily_digests(user_id);
CREATE INDEX idx_daily_digests_created_at ON public.daily_digests(created_at DESC);
