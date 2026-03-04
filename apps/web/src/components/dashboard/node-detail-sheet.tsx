'use client'

import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, Link as LinkIcon, Tag, Clock, Network, FileText } from 'lucide-react'

type DBNode = {
  id: string
  user_id: string
  url: string
  title: string
  summary: string
  raw_text: string
  created_at: string
}

type DBEntity = {
  id: string
  name: string
  type: string
  user_id: string
  node_id: string | null
}

type DBEdge = {
  id: string
  source_id: string
  target_id: string
  relation_type: string
  weight: number
}

interface NodeDetailSheetProps {
  node: DBNode
  entities: DBEntity[]
  allNodes: DBNode[]
  edges: DBEdge[]
  children: React.ReactNode
}

export default function NodeDetailSheet({
  node,
  entities,
  allNodes,
  edges,
  children,
}: NodeDetailSheetProps) {
  const [open, setOpen] = useState(false)

  // Find connected nodes via edges
  const connectedNodeIds = edges
    .filter(e => e.source_id === node.id || e.target_id === node.id)
    .map(e => e.source_id === node.id ? e.target_id : e.source_id)

  const connectedNodes = allNodes.filter(n => connectedNodeIds.includes(n.id))

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  function getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const entityTypeColors: Record<string, string> = {
    person: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    concept: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    tool: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    technology: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    organization: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  }

  function getEntityColor(type: string): string {
    return entityTypeColors[type.toLowerCase()] ?? 'bg-primary/10 text-primary border-primary/20'
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[520px] sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <SheetHeader className="mb-6 space-y-3">
          <SheetTitle className="text-xl leading-tight pr-8">
            {node.title}
          </SheetTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a
              href={node.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline transition-colors"
            >
              <LinkIcon className="h-3 w-3" />
              {getDomainFromUrl(node.url)}
            </a>
            {node.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(node.created_at)}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* AI Summary */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <FileText className="h-3.5 w-3.5" />
              AI Summary
            </h3>
            <div className="rounded-xl bg-card/80 border border-border/50 p-4 text-sm leading-relaxed">
              {node.summary}
            </div>
          </section>

          <Separator className="bg-border/30" />

          {/* Entities */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Tag className="h-3.5 w-3.5" />
              Extracted Entities ({entities.length})
            </h3>
            {entities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entities.map(entity => (
                  <Badge
                    key={entity.id}
                    variant="outline"
                    className={`text-xs px-2.5 py-1 ${getEntityColor(entity.type)}`}
                  >
                    {entity.name}
                    <span className="ml-1 opacity-60 text-[10px]">{entity.type}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No entities extracted for this node.</p>
            )}
          </section>

          <Separator className="bg-border/30" />

          {/* Connections */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Network className="h-3.5 w-3.5" />
              Connected Nodes ({connectedNodes.length})
            </h3>
            {connectedNodes.length > 0 ? (
              <div className="space-y-2">
                {connectedNodes.map(cn => (
                  <div
                    key={cn.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 border border-border/30 p-3 text-sm hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm">{cn.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getDomainFromUrl(cn.url)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No semantic connections found yet.</p>
            )}
          </section>

          <Separator className="bg-border/30" />

          {/* Raw Text Snippet */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Raw Text Snippet
            </h3>
            <div className="relative rounded-xl bg-muted/30 border border-border/30 p-4 text-xs text-muted-foreground/80 font-mono h-32 overflow-hidden">
              {node.raw_text?.substring(0, 500)}...
              <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-background to-transparent" />
            </div>
          </section>

          {/* Actions */}
          <Button variant="outline" className="w-full gap-2 border-border/50 hover:border-primary/30" asChild>
            <a href={node.url} target="_blank" rel="noreferrer">
              Open Original Page <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
