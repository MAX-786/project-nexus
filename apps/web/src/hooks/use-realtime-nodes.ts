'use client'

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useEffect } from 'react'


import type { DBNode } from '@/lib/types'
import { useNodesStore } from '@/stores/nodes-store'
import { createClient } from '@/utils/supabase/client'

/** Checks that an INSERT payload has the minimum required fields for a DBNode. */
function isValidNode(obj: Partial<DBNode>): obj is DBNode {
  return (
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.summary === 'string' &&
    typeof obj.created_at === 'string'
  )
}

/**
 * Subscribes to Supabase realtime changes on the `nodes` table for the given
 * user and keeps the Zustand store in sync.
 *
 * - INSERT  → prepend the new node to the feed (shows up instantly)
 * - UPDATE  → patch title, summary, and is_bookmarked in-place
 * - DELETE  → remove the node (and its dependent entities/edges) optimistically
 *
 * The channel is cleaned up automatically when the component unmounts.
 */
export function useRealtimeNodes(userId: string | undefined) {
  const addNode = useNodesStore((s) => s.addNode)
  const updateNode = useNodesStore((s) => s.updateNode)
  const removeNode = useNodesStore((s) => s.removeNode)
  const toggleBookmark = useNodesStore((s) => s.toggleBookmark)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`nodes:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Partial<DBNode>>) => {
          if (payload.eventType === 'INSERT') {
            if (isValidNode(payload.new)) {
              addNode(payload.new)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Partial<DBNode>
            const { id, title, summary, is_bookmarked } = updated
            if (!id) return

            // Sync mutable text fields
            if (title !== undefined || summary !== undefined) {
              updateNode(id, {
                ...(title !== undefined && { title }),
                ...(summary !== undefined && { summary }),
              })
            }

            // Sync bookmark state via the dedicated toggle action when the
            // current store value differs from the incoming value.
            if (is_bookmarked !== undefined) {
              const current = useNodesStore
                .getState()
                .nodes.find((n) => n.id === id)
              if (current && current.is_bookmarked !== is_bookmarked) {
                toggleBookmark(id)
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as Partial<DBNode>).id
            if (id) removeNode(id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, addNode, updateNode, removeNode, toggleBookmark])
}
