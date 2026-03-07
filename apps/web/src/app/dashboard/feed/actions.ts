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
