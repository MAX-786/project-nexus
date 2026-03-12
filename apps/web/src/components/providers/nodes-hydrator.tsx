'use client'

import { useRef, useEffect } from 'react'

import { useRealtimeNodes } from '@/hooks/use-realtime-nodes'
import type { DBNode, DBEntity, DBEdge } from '@/lib/types'
import { useAuthStore } from '@/stores/auth-store'
import { useNodesStore } from '@/stores/nodes-store'

interface NodesHydratorProps {
  nodes: DBNode[]
  entities: DBEntity[]
  edges: DBEdge[]
  children?: React.ReactNode
}

/**
 * Hydrates the Zustand nodes store from server-fetched data and subscribes to
 * Supabase realtime changes so the feed stays live without a page refresh.
 */
export default function NodesHydrator({ nodes, entities, edges, children }: NodesHydratorProps) {
  const hydrate = useNodesStore((s) => s.hydrate)
  const hydrated = useRef(false)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!hydrated.current) {
      hydrate({ nodes, entities, edges })
      hydrated.current = true
    }
  }, [nodes, entities, edges, hydrate])

  // Subscribe to live node changes for this user.
  useRealtimeNodes(userId)

  return <>{children}</>
}
