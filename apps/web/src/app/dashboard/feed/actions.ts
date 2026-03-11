'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'

/**
 * Deletes a node and all its associated data (entities, edges, review).
 * Cascade deletes in Supabase handle entities and edges via FK constraints,
 * but we also explicitly delete the review entry.
 */
export async function deleteNode(nodeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Delete the review entry for this node (not cascade-deleted by FK)
  await supabase
    .from('reviews')
    .delete()
    .eq('node_id', nodeId)
    .eq('user_id', user.id)

  // Delete the node — entities and edges cascade via FK constraints
  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', nodeId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/feed')
  revalidatePath('/dashboard/graph')
  revalidatePath('/dashboard/review')
  return { success: true }
}

export async function getNodeDetail(nodeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('nodes')
    .select('id, raw_text')
    .eq('id', nodeId)
    .eq('user_id', user.id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function batchDeleteNodes(nodeIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Supabase delete with in filter and owner check
  const { error } = await supabase
    .from('nodes')
    .delete()
    .in('id', nodeIds)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Also manually delete reviews for these nodes to be safe
  await supabase
    .from('reviews')
    .delete()
    .in('node_id', nodeIds)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/feed')
  revalidatePath('/dashboard/graph')
  revalidatePath('/dashboard/review')
  return { success: true }
}

export async function getCollections() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function createCollection(name: string, color?: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('collections')
    .insert({
      name,
      color,
      user_id: user.id,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/feed')
  return { data }
}

export async function addNodesToCollection(nodeIds: string[], collectionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify the user owns the collection first
  const { data: collection, error: colError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()

  if (colError || !collection) {
    return { error: 'Collection not found or access denied' }
  }

  // Map to the junction table format
  const rows = nodeIds.map(nodeId => ({
    node_id: nodeId,
    collection_id: collectionId
  }))

  const { error } = await supabase
    .from('node_collections')
    .upsert(rows, { onConflict: 'node_id,collection_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feed')
  return { success: true }
}

export async function removeNodesFromCollection(nodeIds: string[], collectionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify the user owns the collection
  const { data: collection, error: colError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()

  if (colError || !collection) {
    return { error: 'Collection not found or access denied' }
  }

  const { error } = await supabase
    .from('node_collections')
    .delete()
    .eq('collection_id', collectionId)
    .in('node_id', nodeIds)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feed')
  return { success: true }
}

export async function toggleBookmark(nodeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get current state
  const { data: node, error: fetchError } = await supabase
    .from('nodes')
    .select('is_bookmarked')
    .eq('id', nodeId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !node) return { error: 'Node not found' }

  const newState = !node.is_bookmarked
  const { error } = await supabase
    .from('nodes')
    .update({ is_bookmarked: newState })
    .eq('id', nodeId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feed')
  revalidatePath('/dashboard/graph')
  return { success: true, is_bookmarked: newState }
}

// ---- Tag Actions ----

export async function getTags() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) return { error: error.message }
  return { data }
}

export async function createTag(name: string, color?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: name.trim(), color: color || '#6366f1', user_id: user.id })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Tag already exists' }
    return { error: error.message }
  }
  return { data }
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/feed')
  return { success: true }
}

export async function addTagToNodes(nodeIds: string[], tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const rows = nodeIds.map(nodeId => ({ node_id: nodeId, tag_id: tagId }))
  const { error } = await supabase
    .from('node_tags')
    .upsert(rows, { onConflict: 'node_id,tag_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/feed')
  return { success: true }
}

export async function removeTagFromNode(nodeId: string, tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('node_tags')
    .delete()
    .eq('node_id', nodeId)
    .eq('tag_id', tagId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/feed')
  return { success: true }
}

export async function getNodeTags() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get all node-tag mappings for user's nodes via inner join
  const { data, error } = await supabase
    .from('node_tags')
    .select('node_id, tag_id, nodes!inner(user_id)')
    .eq('nodes.user_id', user.id)

  if (error) return { error: error.message }
  // Strip the joined nodes field from the response
  const mapped = (data ?? []).map(({ node_id, tag_id }) => ({ node_id, tag_id }))
  return { data: mapped }
}

// ---- Highlight Actions ----

export async function getHighlights(nodeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('node_id', nodeId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function createHighlight(nodeId: string, text: string, note?: string, color?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!text.trim()) return { error: 'Highlight text is required' }

  const { data, error } = await supabase
    .from('highlights')
    .insert({
      user_id: user.id,
      node_id: nodeId,
      text: text.trim(),
      note: note?.trim() || null,
      color: color || '#fbbf24',
    })
    .select('*')
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function deleteHighlight(highlightId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('highlights')
    .delete()
    .eq('id', highlightId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateHighlightNote(highlightId: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('highlights')
    .update({ note: note.trim() || null })
    .eq('id', highlightId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
