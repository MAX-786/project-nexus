// ============================================================================
// Canonical database types — matches supabase_setup.sql
// Shared across apps/web and apps/extension via @nexus/shared.
// ============================================================================

export interface DBNode {
  id: string
  user_id: string
  url: string
  title: string
  summary: string
  raw_text?: string | null  // optional, loaded lazily
  created_at: string
  is_bookmarked?: boolean
}

export interface DBEntity {
  id: string
  name: string
  type: string
  user_id: string
  node_id: string | null
}

export interface DBEdge {
  id: string
  source_id: string
  target_id: string
  relation_type: string
  weight: number
  user_id: string
  is_manual?: boolean
  label?: string | null
}

export interface ReviewWithNode {
  id: string
  user_id: string
  node_id: string
  next_review_date: string
  interval: number
  ease_factor: number
  last_reviewed_at: string | null
  node: Pick<DBNode, 'id' | 'title' | 'summary' | 'url'>
}

export interface DBCollection {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

export interface DBNodeCollection {
  node_id: string
  collection_id: string
  created_at: string
}

export interface DBTag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface DBNodeTag {
  node_id: string
  tag_id: string
  created_at: string
}

export interface DBHighlight {
  id: string
  user_id: string
  node_id: string
  text: string
  note: string | null
  color: string
  created_at: string
}

export interface DBConsolidation {
  id: string
  user_id: string
  source_node_ids: string[]
  summary: string
  insight: string
  themes: string[]
  created_at: string
}

/** Minimal user shape hydrated from Supabase auth into Zustand */
export interface AuthUser {
  id: string
  email: string
}

export interface DBUserSettings {
  user_id: string
  shortcuts_enabled: boolean
  custom_shortcuts: Record<string, string>
  updated_at: string
}
