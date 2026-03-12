'use client'

import dynamic from 'next/dynamic'

import type { DBConsolidation, DBNode } from '@/lib/types'
import MemoryLoading from '@/app/dashboard/memory/loading'

// `ssr: false` must live in a Client Component.
type NodePreview = Pick<DBNode, 'id' | 'title' | 'summary' | 'created_at'>

const MemoryClient = dynamic(() => import('./memory-client'), {
  ssr: false,
  loading: () => <MemoryLoading />,
})

interface Props {
  consolidations: DBConsolidation[]
  nodes: NodePreview[]
  unconsolidatedCount: number
  themes: string[]
}

export default function MemoryClientLazy(props: Props) {
  return <MemoryClient {...props} />
}
