'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'

/**
 * Creates a manual edge between two nodes in the knowledge graph.
 */
export async function createManualEdge(
  sourceId: string,
  targetId: string,
  label?: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (sourceId === targetId) {
    return { error: 'Cannot link a node to itself' }
  }

  // Check if edge already exists (in either direction)
  const { data: existing } = await supabase
    .from('edges')
    .select('id')
    .eq('user_id', user.id)
    .or(
      `and(source_id.eq.${sourceId},target_id.eq.${targetId}),and(source_id.eq.${targetId},target_id.eq.${sourceId})`
    )
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'A connection between these nodes already exists' }
  }

  const { data, error } = await supabase
    .from('edges')
    .insert({
      source_id: sourceId,
      target_id: targetId,
      relation_type: 'manual',
      weight: 1.0,
      user_id: user.id,
      is_manual: true,
      label: label || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/graph')
  revalidatePath('/dashboard/feed')
  return { success: true, edge: data }
}

/**
 * Deletes a manual edge from the knowledge graph.
 */
export async function deleteManualEdge(edgeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('edges')
    .delete()
    .eq('id', edgeId)
    .eq('user_id', user.id)
    .eq('is_manual', true)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/graph')
  revalidatePath('/dashboard/feed')
  return { success: true }
}

/**
 * Updates a node's title and/or summary.
 */
export async function updateNode(
  nodeId: string,
  updates: { title?: string; summary?: string }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const updateData: Record<string, string> = {}
  if (updates.title?.trim().length) updateData.title = updates.title.trim()
  if (updates.summary?.trim().length) updateData.summary = updates.summary.trim()

  if (Object.keys(updateData).length === 0) {
    return { error: 'No changes provided' }
  }

  const { error } = await supabase
    .from('nodes')
    .update(updateData)
    .eq('id', nodeId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/feed')
  revalidatePath('/dashboard/graph')
  return { success: true }
}
