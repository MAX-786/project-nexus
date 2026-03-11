-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free'
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Function and trigger to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, tier)
  VALUES (new.id, new.email, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1.5 User Settings table
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  shortcuts_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_shortcuts JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- 2. Nodes table (Content)
CREATE TABLE public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  raw_text TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_bookmarked BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own nodes" ON public.nodes FOR ALL USING (auth.uid() = user_id);

-- 3. Entities table (Tags/Concepts)
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL
);

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own entities" ON public.entities FOR ALL USING (auth.uid() = user_id);

-- 4. Edges table (Relations)
CREATE TABLE public.edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  label TEXT
);

-- Prevent duplicate edges between the same pair of nodes for a user
CREATE UNIQUE INDEX edges_unique_pair ON public.edges (source_id, target_id, user_id);

ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own edges" ON public.edges FOR ALL USING (auth.uid() = user_id);

-- 5. Reviews table (Spaced Repetition)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  next_review_date TIMESTAMPTZ NOT NULL,
  interval INTEGER NOT NULL DEFAULT 0,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  last_reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- 6. Match Nodes Function (Vector Similarity)
CREATE OR REPLACE FUNCTION public.match_nodes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_source_node_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_node RECORD;
BEGIN
  FOR target_node IN
    SELECT id, 1 - (nodes.embedding <=> query_embedding) AS similarity
    FROM public.nodes
    WHERE nodes.user_id = p_user_id
      AND nodes.id != p_source_node_id
      AND 1 - (nodes.embedding <=> query_embedding) > match_threshold
    ORDER BY nodes.embedding <=> query_embedding
    LIMIT match_count
  LOOP
    INSERT INTO public.edges (source_id, target_id, relation_type, weight, user_id)
    VALUES (p_source_node_id, target_node.id, 'semantic_similarity', target_node.similarity, p_user_id)
    ON CONFLICT (source_id, target_id, user_id) DO UPDATE SET weight = EXCLUDED.weight;
  END LOOP;
END;
$$;

-- 7. Collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own collections" ON public.collections FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.node_collections (
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (node_id, collection_id)
);

ALTER TABLE public.node_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own node_collections" ON public.node_collections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.nodes WHERE id = node_id AND user_id = auth.uid()));

-- 8. Tags table (user-created categories)
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

-- 9. Node-Tags junction table
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

-- 10. Highlights table for saving text passages with notes
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

-- 11. Consolidations table (Memory Consolidation)
-- Stores cross-cutting insights discovered across captured nodes.
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
CREATE POLICY "Users can view own consolidations" ON public.consolidations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consolidations" ON public.consolidations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own consolidations" ON public.consolidations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX consolidations_user_id_idx ON public.consolidations (user_id);
CREATE INDEX consolidations_created_at_idx ON public.consolidations (created_at DESC);

-- ============================================================================
-- MIGRATION: Run these statements on an EXISTING database to add new columns.
-- Skip if creating tables fresh (the above CREATE TABLE statements already include them).
-- ============================================================================
-- ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE;
-- CREATE UNIQUE INDEX IF NOT EXISTS edges_unique_pair ON public.edges (source_id, target_id, user_id);
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;
