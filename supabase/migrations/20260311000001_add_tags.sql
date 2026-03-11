-- Tags table for user-created categorization
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tags" ON public.tags FOR ALL USING (auth.uid() = user_id);

-- Junction table mapping nodes to tags
CREATE TABLE public.node_tags (
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (node_id, tag_id)
);

ALTER TABLE public.node_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own node_tags" ON public.node_tags 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.nodes WHERE id = node_id AND user_id = auth.uid())
  );

-- Index for efficient tag lookups
CREATE INDEX idx_node_tags_tag ON public.node_tags (tag_id);
CREATE INDEX idx_node_tags_node ON public.node_tags (node_id);
CREATE INDEX idx_tags_user ON public.tags (user_id);
