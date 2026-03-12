'use client'

import dynamic from 'next/dynamic'

import type { DBNode, DBEdge, DBEntity } from '@/lib/types'
import GraphLoading from '@/app/dashboard/graph/loading'

// `ssr: false` must live in a Client Component.
// Deferring the ReactFlow bundle keeps the initial JS payload lean.
const KnowledgeGraph = dynamic(() => import('./knowledge-graph'), {
  ssr: false,
  loading: () => <GraphLoading />,
})

interface Props {
  initialNodes: DBNode[]
  initialEdges: DBEdge[]
  initialEntities: DBEntity[]
}

export default function KnowledgeGraphLazy(props: Props) {
  return <KnowledgeGraph {...props} />
}
