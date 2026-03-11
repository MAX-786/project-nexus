'use client'

import { useState, useEffect } from 'react'
import { Link2, Loader2, Network, Sparkles, Tag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { getRelatedNodes } from '@/app/dashboard/feed/related-actions'

import type { RelatedNode } from '@/lib/types'

const REASON_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  vector: { label: 'Similar content', icon: Sparkles, color: 'text-purple-500' },
  entity: { label: 'Shared entities', icon: Tag, color: 'text-blue-500' },
  collection: { label: 'Same collection', icon: Network, color: 'text-emerald-500' },
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export default function RelatedNodes({
  nodeId,
  onNavigate,
}: {
  nodeId: string
  onNavigate?: (nodeId: string) => void
}) {
  const [related, setRelated] = useState<RelatedNode[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchRelated() {
      setIsLoading(true)
      try {
        const data = await getRelatedNodes(nodeId, 5)
        if (!cancelled) setRelated(data)
      } catch (err) {
        console.error('Failed to fetch related nodes:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchRelated()
    return () => { cancelled = true }
  }, [nodeId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding related content…
      </div>
    )
  }

  if (related.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No related content found yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-1.5">
        <Link2 className="h-4 w-4" />
        Related Content
      </h4>
      <div className="space-y-1.5">
        {related.map((node) => {
          const reasonInfo = REASON_LABELS[node.reason]
          const ReasonIcon = reasonInfo?.icon ?? Sparkles

          return (
            <button
              key={node.id}
              onClick={() => onNavigate?.(node.id)}
              className={cn(
                'w-full text-left p-2.5 rounded-lg border border-border/50 bg-muted/30',
                'hover:bg-muted/60 transition-colors group',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {node.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {getDomain(node.url)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 flex items-center gap-1">
                  <ReasonIcon className={cn('h-3 w-3', reasonInfo?.color)} />
                  {Math.round(node.similarity_score * 100)}%
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
