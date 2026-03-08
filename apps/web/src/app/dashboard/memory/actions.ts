'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'

/**
 * Save a consolidation result. Called after the client-side AI generates
 * cross-cutting insights from a batch of unconsolidated nodes.
 */
export async function saveConsolidation(data: {
  sourceNodeIds: string[]
  summary: string
  insight: string
  themes: string[]
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  if (data.sourceNodeIds.length < 2) {
    return { error: 'Need at least 2 nodes to consolidate' }
  }

  const { error } = await supabase.from('consolidations').insert({
    user_id: user.id,
    source_node_ids: data.sourceNodeIds,
    summary: data.summary,
    insight: data.insight,
    themes: data.themes,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/memory')
  return { success: true }
}

/**
 * Delete a single consolidation.
 */
export async function deleteConsolidation(consolidationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('consolidations')
    .delete()
    .eq('id', consolidationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/memory')
  return { success: true }
}

/**
 * Clear all consolidations for the current user.
 */
export async function clearConsolidations() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('consolidations')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/memory')
  return { success: true }
}

/**
 * Fetch nodes that haven't been included in any consolidation yet.
 * Returns nodes whose IDs don't appear in any consolidation's source_node_ids.
 */
export async function getUnconsolidatedNodes() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get all consolidation source node IDs
  const { data: consolidations } = await supabase
    .from('consolidations')
    .select('source_node_ids')
    .eq('user_id', user.id)

  const consolidatedIds = new Set(
    (consolidations ?? []).flatMap((c: { source_node_ids: string[] }) => c.source_node_ids),
  )

  // Get all nodes
  const { data: nodes, error } = await supabase
    .from('nodes')
    .select('id, title, summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  const unconsolidated = (nodes ?? []).filter(
    (n: { id: string }) => !consolidatedIds.has(n.id),
  )

  return { data: unconsolidated }
}
