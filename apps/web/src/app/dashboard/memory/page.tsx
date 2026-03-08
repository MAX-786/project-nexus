import { Sparkles } from 'lucide-react'

import { MemoryEmptyState } from '@/components/dashboard/empty-states'
import MemoryClient from '@/components/dashboard/memory-client'
import type { DBConsolidation, DBNode } from '@/lib/types'
import { createClient } from '@/utils/supabase/server'

export default async function MemoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch consolidations + nodes in parallel
  const [consolidationsResult, nodesResult] = await Promise.all([
    supabase
      .from('consolidations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('nodes')
      .select('id, user_id, url, title, summary, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const consolidations: DBConsolidation[] = consolidationsResult.data ?? []
  const nodes: Pick<DBNode, 'id' | 'title' | 'summary' | 'created_at'>[] =
    nodesResult.data ?? []

  // Compute which nodes haven't been consolidated yet
  const consolidatedIds = new Set(
    consolidations.flatMap((c) => c.source_node_ids),
  )
  const unconsolidatedNodes = nodes.filter((n) => !consolidatedIds.has(n.id))

  // Gather unique themes across all consolidations
  const allThemes = [...new Set(consolidations.flatMap((c) => c.themes))]

  return (
    <div className="flex h-full flex-col">
      {/* Memory Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Memory</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {consolidations.length}{' '}
              {consolidations.length === 1 ? 'insight' : 'insights'} discovered
              {unconsolidatedNodes.length > 0 &&
                ` · ${unconsolidatedNodes.length} nodes pending consolidation`}
            </p>
          </div>
        </div>
      </div>

      {/* Memory Content */}
      {nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <MemoryEmptyState hasNodes={false} />
        </div>
      ) : (
        <MemoryClient
          consolidations={consolidations}
          nodes={nodes}
          unconsolidatedCount={unconsolidatedNodes.length}
          themes={allThemes}
        />
      )}
    </div>
  )
}
