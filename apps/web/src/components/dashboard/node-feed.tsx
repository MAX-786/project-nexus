'use client'

import { useState, useRef, useTransition, useCallback, useEffect } from 'react'


import '@xyflow/react/dist/style.css'

import { toast } from 'sonner'
import { deleteNode, getNodeDetail, batchDeleteNodes, toggleBookmark } from '@/app/dashboard/feed/actions'
import { updateNode } from '@/app/dashboard/graph/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node as FlowNode,
  Edge as FlowEdge,
} from '@xyflow/react'
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
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Download,
  Share,
  Copy,
  Filter,
  Star,
  Tags,
  ArrowUpDown,
  Calendar,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DBNode, DBEntity, DBCollection, DBTag } from '@/lib/types'
import { useNodesStore, useFilteredNodes } from '@/stores/nodes-store'
import { useUIStore } from '@/stores/ui-store'
import { createClient } from '@/utils/supabase/client'

import { CollectionTaggerDialog } from './collection-tagger-dialog'
import { FeedEmptyState } from './empty-states'
import { HighlightsPanel } from './highlights-panel'
import { TagManager, NodeTagBadges } from './tag-manager'

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

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
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

function getEmptyFilterMessage(
  searchQuery: string,
  showBookmarksOnly: boolean,
  dateFilter: string,
  selectedTagId: string | null,
): string {
  if (searchQuery) return `No results for "${searchQuery}"`
  if (showBookmarksOnly) return 'No bookmarked memories.'
  if (dateFilter !== 'all') return `No memories in the last ${dateFilter}.`
  if (selectedTagId) return 'No memories with this tag.'
  return 'No memories match your filters.'
}

// ---- Export helpers ----

const MAX_EXPORT_RAW_TEXT_LENGTH = 1000

function exportNodeAsMarkdown(node: DBNode, entities: DBEntity[], rawText?: string | null) {
  const lines = [
    `# ${node.title}`,
    ``,
    `**URL:** ${node.url}`,
    `**Captured:** ${new Date(node.created_at).toLocaleDateString()}`,
    ``,
    `## Summary`,
    ``,
    node.summary,
    ``,
  ]
  if (entities.length > 0) {
    lines.push(`## Entities`, ``)
    entities.forEach((e) => lines.push(`- **${e.name}** (${e.type})`))
    lines.push(``)
  }
  if (rawText) {
    lines.push(`## Raw Text (excerpt)`, ``, rawText.substring(0, MAX_EXPORT_RAW_TEXT_LENGTH), ``)
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${node.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function exportAllAsJSON(nodes: DBNode[], entities: DBEntity[]) {
  const data = nodes.map((node) => ({
    ...node,
    entities: entities.filter((e) => e.node_id === node.id),
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nexus-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportAllAsCSV(nodes: DBNode[], entities: DBEntity[]) {
  const headers = ['id', 'title', 'url', 'summary', 'entities', 'created_at']
  const rows = nodes.map((node) => {
    const nodeEntities = entities.filter((e) => e.node_id === node.id).map((e) => e.name).join('; ')
    return [
      node.id,
      `"${node.title.replace(/"/g, '""')}"`,
      node.url,
      `"${(node.summary || '').replace(/"/g, '""')}"`,
      `"${nodeEntities}"`,
      node.created_at,
    ].join(',')
  })
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nexus-export-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---- Component ----

export default function NodeFeed() {
  const nodes = useNodesStore((s) => s.nodes)
  const entities = useNodesStore((s) => s.entities)
  const edges = useNodesStore((s) => s.edges)
  const searchQuery = useNodesStore((s) => s.searchQuery)
  const removeNodeFromStore = useNodesStore((s) => s.removeNode)

  const selectedNodeId = useUIStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)

  const filteredNodes = useFilteredNodes()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Multi-select state
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)

  // Collections state
  const [collections, setCollections] = useState<DBCollection[]>([])
  const [nodeCollections, setNodeCollections] = useState<{node_id: string, collection_id: string}[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  // Tags state
  const [tags, setTags] = useState<DBTag[]>([])
  const [nodeTags, setNodeTags] = useState<{node_id: string, tag_id: string}[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  // Bookmark filter state
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const toggleBookmarkInStore = useNodesStore((s) => s.toggleBookmark)

  // Sort & date filter state
  type SortOption = 'newest' | 'oldest' | 'most-connections' | 'most-entities'
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')

  // Fetch collections data
  const loadCollectionsData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: cols }, { data: nodeCols }] = await Promise.all([
      supabase.from('collections').select('*').order('name'),
      supabase.from('node_collections').select('node_id, collection_id')
    ])
    if (cols) setCollections(cols)
    if (nodeCols) setNodeCollections(nodeCols)
  }, [])

  useEffect(() => {
    loadCollectionsData()
  }, [loadCollectionsData])

  // Fetch tags data
  const loadTagsData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: t }, { data: nt }] = await Promise.all([
      supabase.from('tags').select('*').order('name'),
      supabase.from('node_tags').select('node_id, tag_id')
    ])
    if (t) setTags(t)
    if (nt) setNodeTags(nt)
  }, [])

  useEffect(() => {
    loadTagsData()
  }, [loadTagsData])

  // Lazy-loaded raw_text for the detail sheet
  const [rawText, setRawText] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    if (!selectedNodeId) {
      setRawText(null)
      return
    }
    setIsLoadingDetail(true)
    getNodeDetail(selectedNodeId).then((result) => {
      if ('data' in result && result.data) setRawText(result.data.raw_text ?? null)
      setIsLoadingDetail(false)
    }).catch(() => {
      setIsLoadingDetail(false)
    })
  }, [selectedNodeId])

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const updateNodeInStore = useNodesStore((s) => s.updateNode)

  function cancelEditing() {
    setIsEditing(false)
    setEditTitle('')
    setEditSummary('')
  }

  const startEditing = (n: DBNode) => {
    setEditTitle(n.title)
    setEditSummary(n.summary || '')
    setIsEditing(true)
  }

  const handleSaveEdit = (nodeId: string) => {
    if (!editTitle.trim()) return
    setIsSaving(true)
    startTransition(async () => {
      const result = await updateNode(nodeId, {
        title: editTitle.trim(),
        summary: editSummary.trim() || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        updateNodeInStore(nodeId, {
          title: editTitle.trim(),
          summary: editSummary.trim() || undefined,
        })
        toast.success("Memory updated successfully")
        setIsEditing(false)
      }
      setIsSaving(false)
    })
  }

  const handleSheetChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedNodeId(null)
      cancelEditing()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelectedNodeId])

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

  const handleBatchDelete = () => {
    if (selectedNodeIds.size === 0) return
    setIsBatchDeleting(true)
    const ids = Array.from(selectedNodeIds)

    startTransition(async () => {
      const result = await batchDeleteNodes(ids)
      if (result.error) {
        toast.error(result.error)
      } else {
        ids.forEach(id => removeNodeFromStore(id))
        toast.success(`${ids.length} nodes deleted successfully`)
        setSelectedNodeIds(new Set())
        if (selectedNodeId && selectedNodeIds.has(selectedNodeId)) {
          setSelectedNodeId(null)
        }
      }
      setIsBatchDeleting(false)
      setShowBatchDeleteDialog(false)
    })
  }

  const toggleSelection = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation()
    const newSet = new Set(selectedNodeIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedNodeIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedNodeIds.size === filteredNodes.length) {
      setSelectedNodeIds(new Set())
    } else {
      setSelectedNodeIds(new Set(filteredNodes.map(n => n.id)))
    }
  }



  // Apply filters (collections, tags, bookmarks, date) and sort
  const displayNodes = (() => {
    let result = filteredNodes
    if (showBookmarksOnly) result = result.filter(n => n.is_bookmarked)
    if (selectedTagId) {
      const taggedNodeIds = new Set(nodeTags.filter(nt => nt.tag_id === selectedTagId).map(nt => nt.node_id))
      result = result.filter(n => taggedNodeIds.has(n.id))
    }
    if (selectedCollectionId) {
      const collectionNodeIds = new Set(nodeCollections.filter(nc => nc.collection_id === selectedCollectionId).map(nc => nc.node_id))
      result = result.filter(n => collectionNodeIds.has(n.id))
    }
    // Date filter
    if (dateFilter !== 'all') {
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      result = result.filter(n => new Date(n.created_at) >= cutoff)
    }
    // Sort (result is already a filtered copy, safe to sort in-place)
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'most-connections':
        result.sort((a, b) => connectionCount(b.id) - connectionCount(a.id))
        break
      case 'most-entities':
        result.sort((a, b) => nodeEntities(b.id).length - nodeEntities(a.id).length)
        break
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
    return result
  })()

  // Virtualized list
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: displayNodes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 160,
    overscan: 5,
    gap: 16,
  })

  if (nodes.length === 0) {
    return <FeedEmptyState />
  }

  const selectedCollection = collections.find(c => c.id === selectedCollectionId)

  return (
    <>
      {/* Feed header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Knowledge Feed</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {nodes.length} {nodes.length === 1 ? 'memory' : 'memories'} captured
              {searchQuery && ` · ${filteredNodes.length} matching search`}
              {selectedCollection && ` · filtered by ${selectedCollection.name}`}
              {showBookmarksOnly && ' · bookmarks only'}
              {dateFilter !== 'all' && ` · last ${dateFilter}`}
              {displayNodes.length !== nodes.length && !searchQuery && ` · ${displayNodes.length} shown`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showBookmarksOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className="gap-1.5"
            >
              <Star className={`h-3.5 w-3.5 ${showBookmarksOnly ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Bookmarks</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" /> 
                  <span className="max-w-[100px] truncate">
                    {selectedCollection ? selectedCollection.name : 'Collections'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem 
                  onClick={() => setSelectedCollectionId(null)}
                  className={!selectedCollectionId ? 'bg-primary/10 text-primary font-medium' : ''}
                >
                  All Memories
                </DropdownMenuItem>
                {collections.length > 0 && <Separator className="my-1" />}
                {collections.map(c => (
                  <DropdownMenuItem 
                    key={c.id} 
                    onClick={() => setSelectedCollectionId(c.id)}
                    className={c.id === selectedCollectionId ? 'bg-primary/10 text-primary font-medium flex items-center gap-2' : 'flex items-center gap-2'}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#64748b' }} />
                    <span className="truncate">{c.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {tags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={selectedTagId ? "default" : "outline"} size="sm" className="gap-1.5">
                    <Tags className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {selectedTagId ? tags.find(t => t.id === selectedTagId)?.name : 'Tags'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedTagId(null)}>
                    All Tags
                  </DropdownMenuItem>
                  {tags.map(tag => (
                    <DropdownMenuItem key={tag.id} onClick={() => setSelectedTagId(tag.id)}>
                      <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Date filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={dateFilter !== 'all' ? "default" : "outline"} size="sm" className="gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {dateFilter === 'all' ? 'All Time' : dateFilter === '7d' ? 'Last 7d' : dateFilter === '30d' ? 'Last 30d' : 'Last 90d'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDateFilter('all')}>All Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('7d')}>Last 7 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('30d')}>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('90d')}>Last 90 Days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'most-connections' ? 'Connections' : 'Entities'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>Oldest First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('most-connections')}>Most Connections</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('most-entities')}>Most Entities</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {nodes.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={() => exportAllAsJSON(nodes, entities)}
              >
                <Download className="h-3.5 w-3.5" /> JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={() => exportAllAsCSV(nodes, entities)}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Virtualized scrollable card list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 relative">
        {displayNodes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <Search className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {getEmptyFilterMessage(searchQuery, showBookmarksOnly, dateFilter, selectedTagId)}
            </p>
          </div>
        ) : (
          <div
            className="p-4 sm:p-6 relative w-full pb-24"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const node = displayNodes[virtualRow.index]
              const ne = nodeEntities(node.id)
              const cc = connectionCount(node.id)
              const isDeleting = deletingId === node.id
              return (
                <div
                  key={node.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingLeft: 'inherit',
                    paddingRight: 'inherit',
                  }}
                >
                  <Card
                    className={`group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-[oklch(0.637_0.237_275/12%)] relative ${
                      selectedNodeIds.has(node.id) ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30 hover:bg-card/80'
                    }`}
                    onClick={(e) => {
                      // If in selection mode and clicking the card body, toggle selection instead of opening sheet
                      if (selectedNodeIds.size > 0) {
                        toggleSelection(e, node.id)
                      } else {
                        setSelectedNodeId(node.id)
                      }
                    }}
                  >
                    <CardHeader className="pb-2 relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div 
                            className={`mt-1 h-6 w-6 shrink-0 flex items-center justify-center rounded-md transition-all ${
                              selectedNodeIds.has(node.id) || selectedNodeIds.size > 0 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                            } hover:bg-primary/20 bg-background/50 backdrop-blur-sm`}
                            onClick={(e) => toggleSelection(e, node.id)}
                          >
                            <Checkbox 
                              checked={selectedNodeIds.has(node.id)} 
                              onCheckedChange={() => {}} // React handles this in onClick of wrapper
                              className="pointer-events-none data-[state=unchecked]:bg-muted data-[state=unchecked]:border-primary/50 hover:data-[state=unchecked]:bg-background/80"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {node.title}
                            </CardTitle>
                            <CardDescription className="mt-1.5 flex items-center gap-1.5 text-xs">
                              {getFaviconUrl(node.url) && (
                                <img
                                  src={getFaviconUrl(node.url)}
                                  alt=""
                                  width={14}
                                  height={14}
                                  className="shrink-0 rounded-sm"
                                  loading="lazy"
                                />
                              )}
                              <span className="truncate">{getDomain(node.url)}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground cursor-default">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(node.created_at)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {formatDate(node.created_at)}
                            </TooltipContent>
                          </Tooltip>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookmarkInStore(node.id)
                              toggleBookmark(node.id)
                            }}
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                            aria-label={node.is_bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                          >
                            <Star className={`h-3.5 w-3.5 ${node.is_bookmarked ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-400'} transition-colors`} />
                          </button>
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
                      <div>
                        <p className={`text-sm text-muted-foreground leading-relaxed ${
                          expandedId === node.id ? '' : 'line-clamp-2'
                        }`}>
                          {node.summary}
                        </p>
                        {node.summary && node.summary.length > 120 && (
                          <button
                            type="button"
                            className="mt-1 flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(expandedId === node.id ? null : node.id)
                            }}
                          >
                            {expandedId === node.id ? (
                              <><ChevronUp className="h-3 w-3" /> Show less</>
                            ) : (
                              <><ChevronDown className="h-3 w-3" /> Read more</>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {ne.slice(0, 3).map((entity) => (
                          <Badge
                            key={entity.id}
                            variant="outline"
                            className={`text-xs px-2 py-0.5 ${getEntityColor(entity.type)}`}
                          >
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {entity.name}
                          </Badge>
                        ))}
                        {ne.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{ne.length - 3} more</span>
                        )}
                        {cc > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Network className="h-3 w-3" />
                            {cc}
                          </span>
                        )}
                      </div>
                      <NodeTagBadges nodeId={node.id} tags={tags} nodeTags={nodeTags} />
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      {selectedNodeIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-background/95 backdrop-blur-xl border border-border shadow-xl rounded-full px-5 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-3 px-2">
              <Checkbox 
                checked={selectedNodeIds.size === filteredNodes.length && filteredNodes.length > 0} 
                onCheckedChange={toggleSelectAll} 
              />
              <div className="flex items-center">
                <Badge variant="secondary" className="rounded-full px-2 leading-none w-6 h-6 flex items-center justify-center mr-2">{selectedNodeIds.size}</Badge>
                <span className="text-sm font-medium">Selected</span>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full h-8 px-3 gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setShowTagDialog(true)}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Tag</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full h-8 px-3 gap-1.5 transition-colors"
                onClick={() => {
                  const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id))
                  exportAllAsJSON(selectedNodes, entities)
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full h-8 px-3 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setShowBatchDeleteDialog(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground" 
              onClick={() => setSelectedNodeIds(new Set())}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedNodeIds.size} node{selectedNodeIds.size === 1 ? '' : 's'}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleBatchDelete()
              }} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isBatchDeleting}
            >
              {isBatchDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete {selectedNodeIds.size} items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Sheet for node details */}
      <Sheet open={!!selectedNodeId} onOpenChange={handleSheetChange}>
        <SheetContent className="w-[520px] sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
          {selectedNode && (
            <>
              <SheetHeader className="mb-6 space-y-3">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-semibold"
                    placeholder="Node title"
                  />
                ) : (
                  <SheetTitle className="text-xl leading-tight pr-8">
                    {selectedNode.title}
                  </SheetTitle>
                )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> AI Summary
                    </h3>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => startEditing(selectedNode)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        rows={6}
                        className="text-sm leading-relaxed"
                        placeholder="Summary..."
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => handleSaveEdit(selectedNode.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-card/80 border border-border/50 p-4 text-sm leading-relaxed">
                      {selectedNode.summary}
                    </div>
                  )}
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

                {selectedNode && <HighlightsPanel nodeId={selectedNode.id} />}

                <Separator className="bg-border/30" />

                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <Network className="h-3.5 w-3.5" /> Connected Nodes ({connectedNodes.length})
                  </h3>
                  {connectedNodes.length > 0 ? (
                    <div className="space-y-4">
                      {/* Interactive Mini-Graph */}
                      <div className="h-64 rounded-xl border border-border/50 bg-background overflow-hidden relative">
                        <ReactFlow
                          nodes={[
                            {
                              id: selectedNode.id,
                              position: { x: 200, y: 100 },
                              data: { label: selectedNode.title },
                              style: {
                                background: 'oklch(0.637 0.237 275 / 15%)',
                                border: '1px solid oklch(0.637 0.237 275 / 50%)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '11px',
                                width: 150,
                                textAlign: 'center' as const,
                              },
                            },
                            ...connectedNodes.map((cn, i) => {
                              // Arrange connected nodes in a semicircle below
                              const angle = Math.PI + (Math.PI / (connectedNodes.length + 1)) * (i + 1)
                              return {
                                id: cn.id,
                                position: {
                                  x: 200 + Math.cos(angle) * 150,
                                  y: 100 - Math.sin(angle) * 80,
                                },
                                data: { label: cn.title },
                                style: {
                                  background: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  fontSize: '10px',
                                  width: 120,
                                  textAlign: 'center' as const,
                                },
                              }
                            }),
                          ]}
                          edges={connectedNodes.map(cn => ({
                            id: `e-${selectedNode.id}-${cn.id}`,
                            source: selectedNode.id,
                            target: cn.id,
                            animated: true,
                            style: { stroke: 'hsl(var(--primary) / 0.4)', strokeWidth: 1.5 },
                          }))}
                          onNodeClick={(_, node) => {
                            if (node.id !== selectedNode.id) {
                              setSelectedNodeId(node.id)
                            }
                          }}
                          fitView
                          panOnDrag={false}
                          zoomOnScroll={false}
                          nodesDraggable={false}
                          nodesConnectable={false}
                        >
                          <Background color="hsl(var(--muted-foreground) / 0.2)" variant={BackgroundVariant.Dots} size={1} />
                        </ReactFlow>
                      </div>
                      
                      {/* List of connections */}
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
                  {isLoadingDetail ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : (
                    <div className="relative rounded-xl bg-muted/30 border border-border/30 p-4 text-xs text-muted-foreground/80 font-mono h-32 overflow-hidden">
                      {rawText ? <>{rawText.substring(0, 500)}...</> : <span className="italic">No raw text available.</span>}
                      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-background to-transparent" />
                    </div>
                  )}
                </section>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" className="flex-1 gap-2 border-border/50 hover:border-primary/30 min-w-[140px]" asChild>
                    <a href={selectedNode.url} target="_blank" rel="noreferrer">
                      Original Page <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 border-border/50 hover:bg-muted min-w-[140px]"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: selectedNode.title,
                          text: selectedNode.summary,
                          url: selectedNode.url,
                        }).catch(console.error)
                      } else {
                        navigator.clipboard.writeText(selectedNode.url)
                        toast.success("Link copied to clipboard!")
                      }
                    }}
                  >
                    Share <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-border/50 hover:border-primary/30"
                    onClick={() => exportNodeAsMarkdown(selectedNode, nodeEntities(selectedNode.id), rawText)}
                  >
                    <Download className="h-4 w-4" />
                    Export MD
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-border/50 text-destructive hover:bg-destructive/10 hover:border-destructive/30 shrink-0"
                    onClick={(e) => handleDelete(selectedNode.id, e)}
                    disabled={deletingId === selectedNode.id}
                  >
                    {deletingId === selectedNode.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {/* Collection Tagger Dialog */}
      <CollectionTaggerDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        selectedNodeIds={Array.from(selectedNodeIds)}
        onSuccess={() => {
          setSelectedNodeIds(new Set())
          loadCollectionsData()
        }}
      />
    </>
  )
}

