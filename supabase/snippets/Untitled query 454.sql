-- Function to search nodes using semantic similarity and/or keyword search
CREATE OR REPLACE FUNCTION public.search_nodes_hybrid(
  query_embedding vector(1536) DEFAULT NULL,
  search_term text DEFAULT NULL,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  url text,
  summary text,
  similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nodes.id,
    nodes.title,
    nodes.url,
    nodes.summary,
    -- Calculate cosine similarity if an embedding is provided, otherwise return 1.0 (exact match) or 0.0
    CASE 
      WHEN query_embedding IS NOT NULL THEN 1 - (nodes.embedding <=> query_embedding)
      ELSE 0.0::float
    END AS similarity
  FROM public.nodes
  WHERE
    -- Enforce RLS directly in case SECURITY DEFINER was used, though we use INVOKER here.
    -- nodes.user_id = auth.uid() is handled automatically by RLS if the query runs as the authenticated user
    nodes.user_id = auth.uid()
    AND (
      -- If both are provided, it must match the text OR we'll rank by vector similarity
      -- For simplicity, if search_term is provided, we filter by it.
      search_term IS NULL OR nodes.title ILIKE '%' || search_term || '%' OR nodes.summary ILIKE '%' || search_term || '%'
    )
  ORDER BY
    -- Order by text match first if only searching by text, otherwise by semantic similarity
    CASE 
      WHEN query_embedding IS NOT NULL THEN (nodes.embedding <=> query_embedding)
      ELSE 0::float -- Default ordering if only text search
    END ASC
  LIMIT match_count;
END;
$$;
