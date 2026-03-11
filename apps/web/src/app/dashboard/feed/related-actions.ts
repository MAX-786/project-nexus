'use server'

import type { RelatedNode } from '@/lib/types'
import { createClient } from '@/utils/supabase/server'

/**
 * Get related nodes for a given node using multiple signals:
 * 1. Vector similarity (via match_nodes function)
 * 2. Shared entities
 * 3. Co-collection membership
 */
export async function getRelatedNodes(
  nodeId: string,
  limit: number = 5,
): Promise<RelatedNode[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Get the current node's embedding
  const { data: currentNode } = await supabase
    .from('nodes')
    .select('id, embedding')
    .eq('id', nodeId)
    .eq('user_id', user.id)
    .single()

  if (!currentNode) return []

  const related: Map<string, RelatedNode> = new Map()

  // 1. Vector similarity (if embedding exists)
  if (currentNode.embedding) {
    const { data: vectorMatches } = await supabase.rpc('match_nodes', {
      query_embedding: currentNode.embedding,
      match_threshold: 0.7,
      match_count: limit + 1,
      p_user_id: user.id,
    })

    if (vectorMatches) {
      for (const match of vectorMatches) {
        if (match.id === nodeId) continue
        related.set(match.id, {
          id: match.id,
          title: match.title,
          summary: match.summary ?? '',
          url: match.url,
          similarity_score: match.similarity ?? 0,
          reason: 'vector',
        })
      }
    }
  }

  // 2. Shared entities — find nodes that share entities with the current node
  const { data: nodeEntities } = await supabase
    .from('entities')
    .select('name')
    .eq('node_id', nodeId)
    .eq('user_id', user.id)

  if (nodeEntities && nodeEntities.length > 0) {
    const entityNames = nodeEntities.map((e: { name: string }) => e.name)

    const { data: sharedEntityNodes } = await supabase
      .from('entities')
      .select('node_id, name')
      .eq('user_id', user.id)
      .in('name', entityNames)
      .neq('node_id', nodeId)

    if (sharedEntityNodes) {
      // Count shared entities per node
      const sharedCounts = new Map<string, number>()
      for (const e of sharedEntityNodes) {
        if (!e.node_id) continue
        sharedCounts.set(e.node_id, (sharedCounts.get(e.node_id) ?? 0) + 1)
      }

      // Only include nodes with 2+ shared entities
      for (const [relatedNodeId, count] of sharedCounts) {
        if (count >= 2 && !related.has(relatedNodeId)) {
          // Fetch node details
          const { data: node } = await supabase
            .from('nodes')
            .select('id, title, summary, url')
            .eq('id', relatedNodeId)
            .single()

          if (node) {
            related.set(relatedNodeId, {
              id: node.id,
              title: node.title,
              summary: node.summary ?? '',
              url: node.url,
              similarity_score: count / entityNames.length,
              reason: 'entity',
            })
          }
        }
      }
    }
  }

  // 3. Co-collection membership
  const { data: nodeCollections } = await supabase
    .from('node_collections')
    .select('collection_id')
    .eq('node_id', nodeId)
    .eq('user_id', user.id)

  if (nodeCollections && nodeCollections.length > 0) {
    const collectionIds = nodeCollections.map((nc: { collection_id: string }) => nc.collection_id)

    const { data: coMembers } = await supabase
      .from('node_collections')
      .select('node_id')
      .in('collection_id', collectionIds)
      .neq('node_id', nodeId)
      .eq('user_id', user.id)

    if (coMembers) {
      for (const member of coMembers) {
        if (!related.has(member.node_id)) {
          const { data: node } = await supabase
            .from('nodes')
            .select('id, title, summary, url')
            .eq('id', member.node_id)
            .single()

          if (node) {
            related.set(member.node_id, {
              id: node.id,
              title: node.title,
              summary: node.summary ?? '',
              url: node.url,
              similarity_score: 0.5,
              reason: 'collection',
            })
          }
        }
      }
    }
  }

  // Sort by similarity score and limit
  return Array.from(related.values())
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit)
}
