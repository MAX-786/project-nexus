'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  ExternalLink,
  Clock,
  Tag,
  Sparkles,
  Inbox,
  Link as LinkIcon,
  Network,
  FileText,
  Search,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useNodesStore, useFilteredNodes } from '@/stores/nodes-store'
import { useUIStore } from '@/stores/ui-store'
import { deleteNode } from '@/app/dashboard/feed/actions'
import type { DBNode } from '@/lib/types'

// ---- Helpers ----

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
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

function getDomain(url: string): string {
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

// ---- Component ----

export default function NodeFeed() {
  const nodes = useNodesStore((s) => s.nodes)
  const entities = useNodesStore((s) => s.entities)
  const edges = useNodesStore((s) => s.edges)
  const searchQuery = useNodesStore((s) => s.searchQuery)
  const setSearchQuery = useNodesStore((s) => s.setSearchQuery)
  const removeNodeFromStore = useNodesStore((s) => s.removeNode)

  const selectedNodeId = useUIStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)

  const filteredNodes = useFilteredNodes()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const nodeEntities = (nodeId: string) => entities.filter((e) => e.node_id === nodeId)
  const connectionCount = (nodeId: string) =>
    edges.filter((e) => e.source_id === nodeId || e.target_id === nodeId).length

  const connectedNodes = selectedNode
    ? edges
        .filter((e) => e.source_id === selectedNode.id || e.target_id === selectedNode.id)
        .map((e) => (e.source_id === selectedNode.id ? e.target_id : e.source_id))
        .map((id) => nodes.find((n) => n.id === id))
        .filter((n): n is DBNode => !!n)
    : []

  const handleDelete = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(nodeId)

    startTransition(async () => {
      const result = await deleteNode(nodeId)
      if (result.error) {
        toast.error(result.error)
      } else {
        removeNodeFromStore(nodeId)
        toast.success('Node deleted successfully')
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null)
        }
      }
      setDeletingId(null)
    })
  }

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No memories yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Use the Nexus browser extension to capture web pages. They&apos;ll appear here with AI-generated summaries.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Feed header + search */}
      <div className="px-6 py-4 border-b border-border/50 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Knowledge Feed</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {nodes.length} {nodes.length === 1 ? 'memory' : 'memories'} captured
              {searchQuery && ` · ${filteredNodes.length} matching`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="flex h-9 w-full rounded-lg border border-border/50 bg-background/50 pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors"
            placeholder="Search by title, summary, or entity…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 flex flex-col gap-4">
          {filteredNodes.length === 0 && searchQuery ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No results for &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            filteredNodes.map((node) => {
              const ne = nodeEntities(node.id)
              const cc = connectionCount(node.id)
              const isDeleting = deletingId === node.id
              return (
                <Card
                  key={node.id}
                  className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {node.title}
                        </CardTitle>
                        <CardDescription className="mt-1.5 flex items-center gap-1.5 text-xs">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{getDomain(node.url)}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(node.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(node.id, e)}
                          disabled={isDeleting}
                          title="Delete node"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {node.summary}
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {ne.slice(0, 3).map((entity) => (
                        <Badge
                          key={entity.id}
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                        >
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {entity.name}
                        </Badge>
                      ))}
                      {ne.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{ne.length - 3} more</span>
                      )}
                      {cc > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {cc} {cc === 1 ? 'link' : 'links'}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Single Sheet for node details */}
      <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent className="w-[520px] sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
          {selectedNode && (
            <>
              <SheetHeader className="mb-6 space-y-3">
                <SheetTitle className="text-xl leading-tight pr-8">
                  {selectedNode.title}
                </SheetTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <a
                    href={selectedNode.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {getDomain(selectedNode.url)}
                  </a>
                  {selectedNode.created_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(selectedNode.created_at)}
                    </span>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <FileText className="h-3.5 w-3.5" /> AI Summary
                  </h3>
                  <div className="rounded-xl bg-card/80 border border-border/50 p-4 text-sm leading-relaxed">
                    {selectedNode.summary}
                  </div>
                </section>

                <Separator className="bg-border/30" />

                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <Tag className="h-3.5 w-3.5" /> Entities ({nodeEntities(selectedNode.id).length})
                  </h3>
                  {nodeEntities(selectedNode.id).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {nodeEntities(selectedNode.id).map((entity) => (
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

                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <Network className="h-3.5 w-3.5" /> Connected Nodes ({connectedNodes.length})
                  </h3>
                  {connectedNodes.length > 0 ? (
                    <div className="space-y-2">
                      {connectedNodes.map((cn) => (
                        <div
                          key={cn.id}
                          className="flex items-center gap-3 rounded-lg bg-muted/50 border border-border/30 p-3 text-sm hover:border-primary/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedNodeId(cn.id)}
                        >
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{cn.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{getDomain(cn.url)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No semantic connections found yet.</p>
                  )}
                </section>

                <Separator className="bg-border/30" />

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Raw Text Snippet
                  </h3>
                  <div className="relative rounded-xl bg-muted/30 border border-border/30 p-4 text-xs text-muted-foreground/80 font-mono h-32 overflow-hidden">
                    {selectedNode.raw_text?.substring(0, 500)}...
                    <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-background to-transparent" />
                  </div>
                </section>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 border-border/50 hover:border-primary/30" asChild>
                    <a href={selectedNode.url} target="_blank" rel="noreferrer">
                      Open Original Page <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-border/50 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    onClick={(e) => handleDelete(selectedNode.id, e)}
                    disabled={deletingId === selectedNode.id}
                  >
                    {deletingId === selectedNode.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
