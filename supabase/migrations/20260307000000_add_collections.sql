-- 1. Collections Table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own collections" ON public.collections FOR ALL USING (auth.uid() = user_id);

-- 2. Node Collections Junction Table
CREATE TABLE public.node_collections (
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (node_id, collection_id)
);

-- We need a way to check user access for the junction table.
-- Option 1: Just rely on foreign key to collections, but RLS on junction table itself needs a policy.
-- A user can manage a node_collection if they own the collection.
ALTER TABLE public.node_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own node collections" ON public.node_collections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = node_collections.collection_id
    AND user_id = auth.uid()
  )
);
