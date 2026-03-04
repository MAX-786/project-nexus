'use client'

import { useRef, useEffect } from 'react'
import { useNodesStore } from '@/stores/nodes-store'
import type { DBNode, DBEntity, DBEdge } from '@/lib/types'

interface NodesHydratorProps {
  nodes: DBNode[]
  entities: DBEntity[]
  edges: DBEdge[]
  children?: React.ReactNode
}

/**
 * Hydrates the Zustand nodes store from server-fetched data.
 * Place inside feed/graph pages to push server data into the client store.
 */
export default function NodesHydrator({ nodes, entities, edges, children }: NodesHydratorProps) {
  const hydrate = useNodesStore((s) => s.hydrate)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrate({ nodes, entities, edges })
      hydrated.current = true
    }
  }, [nodes, entities, edges, hydrate])

  return <>{children}</>
}
