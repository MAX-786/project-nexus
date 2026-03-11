-- Highlights table for saving text passages with notes
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  note TEXT,
  color TEXT NOT NULL DEFAULT '#fbbf24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own highlights" ON public.highlights FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_highlights_node ON public.highlights (node_id);
CREATE INDEX idx_highlights_user ON public.highlights (user_id);
