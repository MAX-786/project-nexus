'use client'

import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node as FlowNode,
  Edge as FlowEdge,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
  Connection,
  MarkerType,
} from '@xyflow/react'
import {
  Network,
  ExternalLink,
  Clock,
  Tag,
  FileText,
  Link as LinkIcon,
  Link2,
  Link2Off,
  MousePointer2,
  Trash2,
  Loader2,
  Sparkles,
  Hand,
  AlertTriangle,
  Filter,
  Maximize2,
  Eye,
  EyeOff,
  X,
  CalendarDays,
} from 'lucide-react'
import React, { useState, useMemo, useCallback, useTransition, useEffect } from 'react'
import '@xyflow/react/dist/style.css'

import { toast } from 'sonner'

import { createManualEdge, deleteManualEdge } from '@/app/dashboard/graph/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getLocalCluster } from '@/lib/graph-cluster'
import type { DBNode, DBEntity, DBEdge } from '@/lib/types'
import { useUIStore } from '@/stores/ui-store'

import { GraphEmptyState } from './empty-states'


interface KnowledgeGraphProps {
  initialNodes: DBNode[]
  initialEdges: DBEdge[]
  initialEntities: DBEntity[]
}

// Entity type → hex color mapping (used in minimap + node accents)
export const ENTITY_TYPE_COLORS: Record<string, string> = {
  person: '#f97316',
  organization: '#3b82f6',
  location: '#22c55e',
  technology: '#a855f7',
  concept: '#eab308',
  event: '#ef4444',
  product: '#06b6d4',
  default: '#818cf8',
}

function getEntityTypeColor(type: string): string {
  return ENTITY_TYPE_COLORS[type?.toLowerCase()] ?? ENTITY_TYPE_COLORS.default
}

/**
 * Builds a cluster-based layout: nodes are grouped by their primary entity type
 * and each type cluster is arranged around the canvas in a circular pattern.
 */
function buildEntityClusterLayout(
  nodes: DBNode[],
  entities: DBEntity[]
): Map<string, { x: number; y: number }> {
  // Determine primary entity type for each node
  const primaryTypeMap = new Map<string, string>()
  nodes.forEach((node) => {
    const nodeEntities = entities.filter((e) => e.node_id === node.id)
    primaryTypeMap.set(node.id, nodeEntities[0]?.type?.toLowerCase() ?? 'default')
  })

  // Group nodes by primary entity type
  const typeGroups = new Map<string, string[]>()
  primaryTypeMap.forEach((type, nodeId) => {
    if (!typeGroups.has(type)) typeGroups.set(type, [])
    typeGroups.get(type)!.push(nodeId)
  })

  const positions = new Map<string, { x: number; y: number }>()
  const types = Array.from(typeGroups.keys())
  const numTypes = Math.max(types.length, 1)

  // Arrange cluster centers in a circle
  const clusterRadius = Math.max(MIN_CLUSTER_RADIUS, numTypes * CLUSTER_SPACING_PER_TYPE)

  types.forEach((type, typeIndex) => {
    const nodeIds = typeGroups.get(type)!
    const angle = (2 * Math.PI * typeIndex) / numTypes - Math.PI / 2
    const centerX = Math.cos(angle) * clusterRadius + clusterRadius + 200
    const centerY = Math.sin(angle) * clusterRadius + clusterRadius + 200

    const cols = Math.max(2, Math.ceil(Math.sqrt(nodeIds.length)))
    nodeIds.forEach((nodeId, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const jitterX = Math.sin(i * JITTER_SEED_X) * JITTER_MAGNITUDE
      const jitterY = Math.cos(i * JITTER_SEED_Y) * JITTER_MAGNITUDE
      positions.set(nodeId, {
        x: centerX + (col - cols / 2) * NODE_HORIZONTAL_SPACING + jitterX,
        y: centerY + (row - Math.ceil(nodeIds.length / cols) / 2) * NODE_VERTICAL_SPACING + jitterY,
      })
    })
  })

  return positions
}

// Custom Node Component
function NexusNode({ data }: NodeProps) {
  const entityCount = (data.entities as DBEntity[])?.length ?? 0
  const isConnectMode = data.isConnectMode as boolean
  const dimmed = data.dimmed as boolean | undefined
  const entityTypeColor = (data.entityTypeColor as string) || ENTITY_TYPE_COLORS.default
  const primaryEntityType = (data.primaryEntityType as string) || 'default'

  return (
    <div
      className="group relative transition-opacity duration-200"
      style={{ opacity: dimmed ? DIMMED_NODE_OPACITY : 1 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !border-2 transition-all duration-200 ${
          isConnectMode
            ? '!bg-emerald-500 !border-emerald-400 !opacity-100'
            : '!bg-primary !border-primary/50'
        }`}
      />
      <div
        className={`min-w-[180px] max-w-[220px] rounded-xl bg-card/90 backdrop-blur-sm border p-3 shadow-lg shadow-black/20 transition-all duration-300 cursor-pointer overflow-hidden ${
          isConnectMode
            ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/20'
            : 'border-border/50 hover:border-primary/40 hover:shadow-primary/10'
        }`}
      >
        {/* Entity type color accent bar */}
        <div
          className="absolute top-0 left-0 w-full h-0.5 rounded-t-xl opacity-80"
          style={{ background: entityTypeColor }}
        />
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1 mt-0.5">
          {data.label as string}
        </p>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
          {data.summary as string}
        </p>
        {entityCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: entityTypeColor }}
            />
            <span className="text-[10px] capitalize" style={{ color: entityTypeColor }}>
              {primaryEntityType !== 'default' ? primaryEntityType : 'node'} · {entityCount}
            </span>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !border-2 transition-all duration-200 ${
          isConnectMode
            ? '!bg-emerald-500 !border-emerald-400 !opacity-100'
            : '!bg-primary !border-primary/50'
        }`}
      />
    </div>
  )
}

const nodeTypes = { nexusNode: NexusNode }

const LARGE_GRAPH_THRESHOLD = 500
const DEFAULT_CLUSTER_DEPTH = 2
const FIT_VIEW_DURATION = 800
const FIT_VIEW_PADDING = 0.2
const FIT_VIEW_NODE_PADDING = 1.5

// Focus mode dimming intensity for unrelated nodes
const DIMMED_NODE_OPACITY = 0.18

// Cluster layout constants
const MIN_CLUSTER_RADIUS = 500
const CLUSTER_SPACING_PER_TYPE = 160
const NODE_HORIZONTAL_SPACING = 270
const NODE_VERTICAL_SPACING = 210
const JITTER_SEED_X = 1337
const JITTER_SEED_Y = 7919
const JITTER_MAGNITUDE = 25

// Edge weight-to-visual constants
const MIN_EDGE_WIDTH = 1
const MAX_EDGE_WIDTH = 3
const EDGE_WIDTH_SCALE_FACTOR = 4
const MIN_EDGE_OPACITY_PERCENT = 25
const EDGE_OPACITY_SCALE_FACTOR = 70

function KnowledgeGraphInner({
  initialNodes = [],
  initialEdges = [],
  initialEntities = [],
}: KnowledgeGraphProps) {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)
  const selectedDBNode = initialNodes.find((n) => n.id === selectedNodeId)
  const { fitView, fitBounds, getNode } = useReactFlow()

  // Connect mode state
  const [connectMode, setConnectMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  // Cluster pagination state
  const [showAll, setShowAll] = useState(false)

  // Focus mode — dim unrelated nodes on hover
  const [focusMode, setFocusMode] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterEntityTypes, setFilterEntityTypes] = useState<Set<string>>(new Set())
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Track DB edges for manual edge detection
  const [dbEdges, setDbEdges] = useState<DBEdge[]>(initialEdges)

  // All unique entity types present in the graph
  const allEntityTypes = useMemo(() => {
    const types = new Set<string>()
    initialEntities.forEach((e) => {
      if (e.type) types.add(e.type.toLowerCase())
    })
    return Array.from(types).sort()
  }, [initialEntities])

  // Is any filter active?
  const isFilterActive = filterEntityTypes.size > 0 || filterDateFrom !== '' || filterDateTo !== ''

  // Memoized count of active filters (used in the filter button badge)
  const activeFilterCount = useMemo(
    () => filterEntityTypes.size + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0),
    [filterEntityTypes, filterDateFrom, filterDateTo]
  )

  // BFS cluster computation
  const isClusterActive = !showAll && !!selectedNodeId
  const clusterNodeIds = useMemo(() => {
    if (!isClusterActive || !selectedNodeId) return null
    return getLocalCluster(selectedNodeId, dbEdges, DEFAULT_CLUSTER_DEPTH)
  }, [isClusterActive, selectedNodeId, dbEdges])

  // Precompute entity-type cluster layout once
  const clusterLayout = useMemo(
    () => buildEntityClusterLayout(initialNodes, initialEntities),
    [initialNodes, initialEntities]
  )

  // Precompute primary entity type + color per node
  const nodeEntityMeta = useMemo(() => {
    return new Map(
      initialNodes.map((node) => {
        const nodeEntities = initialEntities.filter((e) => e.node_id === node.id)
        const primaryType = nodeEntities[0]?.type?.toLowerCase() ?? 'default'
        return [node.id, { primaryType, color: getEntityTypeColor(primaryType) }]
      })
    )
  }, [initialNodes, initialEntities])

  // Map DB Nodes to React Flow Nodes — entity-cluster layout
  const initialFlowNodes: FlowNode[] = useMemo(() => {
    return initialNodes.map((node) => {
      const pos = clusterLayout.get(node.id) ?? { x: 100, y: 100 }
      const meta = nodeEntityMeta.get(node.id) ?? { primaryType: 'default', color: ENTITY_TYPE_COLORS.default }
      return {
        id: node.id,
        type: 'nexusNode',
        position: pos,
        data: {
          label: node.title,
          summary: node.summary,
          entities: initialEntities.filter((e) => e.node_id === node.id),
          isConnectMode: connectMode,
          primaryEntityType: meta.primaryType,
          entityTypeColor: meta.color,
          dimmed: false,
        },
      }
    })
  }, [initialNodes, initialEntities, connectMode, clusterLayout, nodeEntityMeta])

  // Map DB Edges to React Flow Edges — distinguish manual vs auto, weight-based width
  const initialFlowEdges: FlowEdge[] = useMemo(() => {
    return dbEdges.map((edge) => {
      const isManual = edge.is_manual === true
      const weight = edge.weight ?? 0.5
      // Scale stroke width with similarity (1–3px for AI edges)
      const strokeWidth = isManual ? 2 : Math.max(MIN_EDGE_WIDTH, Math.min(MAX_EDGE_WIDTH, weight * EDGE_WIDTH_SCALE_FACTOR))
      return {
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        animated: !isManual,
        label: isManual ? (edge.label || 'Manual Link') : undefined,
        labelStyle: isManual ? { fontSize: 10, fill: 'oklch(0.8 0.15 150)' } : undefined,
        labelBgStyle: isManual ? { fill: 'oklch(0.15 0.02 275)', fillOpacity: 0.9 } : undefined,
        labelBgPadding: [6, 3] as [number, number],
        markerEnd: isManual
          ? { type: MarkerType.ArrowClosed, color: 'oklch(0.6 0.2 150)' }
          : undefined,
        style: {
          stroke: isManual ? 'oklch(0.6 0.2 150 / 70%)' : `oklch(0.637 0.237 275 / ${Math.max(MIN_EDGE_OPACITY_PERCENT, weight * EDGE_OPACITY_SCALE_FACTOR)}%)`,
          strokeWidth,
          strokeDasharray: isManual ? '6 3' : undefined,
        },
      }
    })
  }, [dbEdges])

  const [nodes, setNodes] = useState<FlowNode[]>(initialFlowNodes)
  const [edges, setEdges] = useState<FlowEdge[]>(initialFlowEdges)

  // Nodes that pass the entity-type / date filter
  const filterPassingNodeIds = useMemo(() => {
    if (!isFilterActive) return null
    const ids = new Set<string>()
    initialNodes.forEach((dbNode) => {
      // Date filter: compare ISO date prefix strings (YYYY-MM-DD) to avoid timezone issues
      if (filterDateFrom && dbNode.created_at) {
        const nodeDate = dbNode.created_at.slice(0, 10)
        if (nodeDate < filterDateFrom) return
      }
      if (filterDateTo && dbNode.created_at) {
        const nodeDate = dbNode.created_at.slice(0, 10)
        if (nodeDate > filterDateTo) return
      }
      // Entity type filter
      if (filterEntityTypes.size > 0) {
        const nodeEntTypes = initialEntities
          .filter((e) => e.node_id === dbNode.id)
          .map((e) => e.type?.toLowerCase())
        const hasMatch = nodeEntTypes.some((t) => t && filterEntityTypes.has(t))
        if (!hasMatch) return
      }
      ids.add(dbNode.id)
    })
    return ids
  }, [isFilterActive, filterEntityTypes, filterDateFrom, filterDateTo, initialNodes, initialEntities])

  // Connected node IDs for focus mode (direct neighbors of hovered node)
  const focusedNeighborIds = useMemo(() => {
    if (!focusMode || !hoveredNodeId) return null
    const ids = new Set<string>([hoveredNodeId])
    dbEdges.forEach((e) => {
      if (e.source_id === hoveredNodeId) ids.add(e.target_id)
      if (e.target_id === hoveredNodeId) ids.add(e.source_id)
    })
    return ids
  }, [focusMode, hoveredNodeId, dbEdges])

  // Compute visible nodes/edges based on cluster filter + entity filter
  const visibleNodes = useMemo(() => {
    return nodes
      .filter((n) => {
        if (clusterNodeIds && !clusterNodeIds.has(n.id)) return false
        if (filterPassingNodeIds && !filterPassingNodeIds.has(n.id)) return false
        return true
      })
      .map((n) => ({
        ...n,
        data: {
          ...n.data,
          dimmed: focusedNeighborIds !== null && !focusedNeighborIds.has(n.id),
        },
      }))
  }, [nodes, clusterNodeIds, filterPassingNodeIds, focusedNeighborIds])

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map((n) => n.id))
    return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
  }, [edges, visibleNodes])

  // Smooth zoom-to-fit when cluster changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: FIT_VIEW_DURATION, padding: FIT_VIEW_PADDING })
    }, 50)
    return () => clearTimeout(timer)
  }, [clusterNodeIds, fitView])

  // Update nodes when connect mode changes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isConnectMode: connectMode },
      }))
    )
  }, [connectMode])

  // Sync flow edges when dbEdges change
  React.useEffect(() => {
    setEdges(initialFlowEdges)
  }, [initialFlowEdges])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      if (!connectMode) {
        setSelectedNodeId(node.id)
        // Center the graph on the clicked node
        const rfNode = getNode(node.id)
        if (rfNode) {
          const { x, y } = rfNode.position
          const w = rfNode.measured?.width ?? 200
          const h = rfNode.measured?.height ?? 80
          fitBounds(
            { x, y, width: w, height: h },
            { duration: FIT_VIEW_DURATION, padding: FIT_VIEW_NODE_PADDING }
          )
        }
      }
    },
    [setSelectedNodeId, connectMode, getNode, fitBounds]
  )

  // Focus mode: track hovered node
  const onNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      if (focusMode) setHoveredNodeId(node.id)
    },
    [focusMode]
  )
  const onNodeMouseLeave = useCallback(() => {
    if (focusMode) setHoveredNodeId(null)
  }, [focusMode])

  // Handle edge click — select edge for context actions
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: FlowEdge) => {
      setSelectedEdgeId(edge.id)
    },
    []
  )

  // Handle new connection (manual link creation)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) {
        toast.error('Cannot link a node to itself')
        return
      }

      const sourceId = connection.source
      const targetId = connection.target

      startTransition(async () => {
        const result = await createManualEdge(sourceId, targetId)
        if (result.error) {
          toast.error(result.error)
        } else if (result.edge) {
          const newEdge = result.edge as DBEdge
          setDbEdges((prev) => [...prev, newEdge])
          toast.success('Manual link created!')
        }
      })
    },
    []
  )

  // Handle manual edge deletion
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      const dbEdge = dbEdges.find((e) => e.id === edgeId)
      if (!dbEdge?.is_manual) {
        toast.error('Only manual links can be deleted from the graph')
        return
      }

      startTransition(async () => {
        const result = await deleteManualEdge(edgeId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setDbEdges((prev) => prev.filter((e) => e.id !== edgeId))
          setSelectedEdgeId(null)
          toast.success('Manual link removed')
        }
      })
    },
    [dbEdges]
  )

  // Edge counts
  const manualEdgeCount = dbEdges.filter((e) => e.is_manual).length
  const autoEdgeCount = dbEdges.filter((e) => !e.is_manual).length

  const handleSelectMode = useCallback(() => {
    setConnectMode(false)
    setSelectedEdgeId(null)
  }, [])

  const handleConnectMode = useCallback(() => {
    setConnectMode(true)
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  const handleDismissEdge = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  // Toggle an entity type in the filter set
  const handleEntityTypeFilter = useCallback((type: string, checked: boolean) => {
    setFilterEntityTypes((prev) => {
      const next = new Set(prev)
      if (checked) next.add(type)
      else next.delete(type)
      return next
    })
  }, [])

  // Clear all active filters
  const handleClearFilters = useCallback(() => {
    setFilterEntityTypes(new Set())
    setFilterDateFrom('')
    setFilterDateTo('')
  }, [])

  // Show All toggle handler with large graph warning
  const handleShowAllToggle = useCallback(
    (checked: boolean) => {
      if (checked && initialNodes.length >= LARGE_GRAPH_THRESHOLD) {
        toast.warning(
          `Loading all ${initialNodes.length} nodes may affect performance`,
          { icon: <AlertTriangle className="h-4 w-4" />, duration: 4000 }
        )
      }
      setShowAll(checked)
    },
    [initialNodes.length]
  )

  if (initialNodes.length === 0) {
    return <GraphEmptyState />
  }

  return (
    <div className="h-full w-full relative">
      {/* Graph Toolbar — Left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 p-1 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={!connectMode ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSelectMode}
              >
                <MousePointer2 className="h-3.5 w-3.5" />
                Select
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Click nodes to view details</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={connectMode ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 gap-1.5 text-xs ${connectMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                onClick={handleConnectMode}
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Drag between nodes to create manual links</TooltipContent>
          </Tooltip>
        </div>

        {/* Edge Stats */}
        <div className="flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {autoEdgeCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">AI-generated connections</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-3" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hand className="h-3 w-3 text-emerald-500" />
                {manualEdgeCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">Manual connections</TooltipContent>
          </Tooltip>
        </div>

        {/* Focus Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={focusMode ? 'default' : 'outline'}
              size="sm"
              className={`h-8 gap-1.5 text-xs rounded-xl bg-card/90 backdrop-blur-sm shadow-lg ${
                focusMode ? 'border-primary/60' : 'border-border/50'
              }`}
              onClick={() => {
                setFocusMode((v) => !v)
                setHoveredNodeId(null)
              }}
            >
              {focusMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Focus
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {focusMode ? 'Focus mode ON — hover a node to dim unrelated nodes' : 'Enable focus mode'}
          </TooltipContent>
        </Tooltip>

        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 text-xs rounded-xl bg-card/90 backdrop-blur-sm shadow-lg ${
                isFilterActive ? 'border-primary/60 text-primary' : 'border-border/50'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              {isFilterActive && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 p-4 bg-card/95 backdrop-blur-xl border-border/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Filter Graph</p>
                {isFilterActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground gap-1"
                    onClick={handleClearFilters}
                  >
                    <X className="h-3 w-3" /> Clear all
                  </Button>
                )}
              </div>

              {/* Entity Type Filter */}
              {allEntityTypes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Entity Type
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {allEntityTypes.map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <Checkbox
                          id={`filter-${type}`}
                          checked={filterEntityTypes.has(type)}
                          onCheckedChange={(checked) =>
                            handleEntityTypeFilter(type, checked === true)
                          }
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex items-center gap-1.5 text-xs capitalize text-muted-foreground group-hover:text-foreground transition-colors">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ background: getEntityTypeColor(type) }}
                          />
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Date Range
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground w-8 shrink-0">From</Label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="h-7 text-xs bg-background/60"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground w-8 shrink-0">To</Label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="h-7 text-xs bg-background/60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Cluster Controls — Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Zoom-to-Fit Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-xl bg-card/90 backdrop-blur-sm border-border/50 shadow-lg"
              onClick={() => fitView({ duration: FIT_VIEW_DURATION, padding: FIT_VIEW_PADDING })}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Zoom to fit all nodes</TooltipContent>
        </Tooltip>

        {/* Node Count Indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 shadow-lg">
          <Network className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Showing {visibleNodes.length} of {initialNodes.length} nodes
          </span>
        </div>

        {/* Show All Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 shadow-lg">
              <label
                htmlFor="show-all-toggle"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                Show All
              </label>
              <Switch
                id="show-all-toggle"
                checked={showAll}
                onCheckedChange={handleShowAllToggle}
                size="sm"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {showAll
              ? 'Showing full graph — toggle off to view local cluster'
              : 'Toggle to show all nodes instead of the local cluster'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Connect Mode Banner */}
      {connectMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 shadow-lg backdrop-blur-sm">
          <Link2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-emerald-400 font-medium">
            Connect Mode — Drag from one node&apos;s handle to another to create a link
          </span>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
        </div>
      )}

      {/* Selected Edge Actions */}
      {selectedEdgeId && (() => {
        const dbEdge = dbEdges.find((e) => e.id === selectedEdgeId)
        if (!dbEdge) return null
        return (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-sm border border-border/50 px-4 py-2.5 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {dbEdge.is_manual ? (
                <><Hand className="h-3 w-3 text-emerald-500" /> Manual Link</>
              ) : (
                <><Sparkles className="h-3 w-3 text-primary" /> AI Connection (similarity: {(dbEdge.weight * 100).toFixed(0)}%)</>
              )}
            </div>
            {dbEdge.label && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs text-foreground">{dbEdge.label}</span>
              </>
            )}
            <Separator orientation="vertical" className="h-4" />
            {dbEdge.is_manual ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteEdge(dbEdge.id)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remove
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground/60">AI links cannot be removed</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleDismissEdge}
            >
              Dismiss
            </Button>
          </div>
        )
      })()}

      {/* Graph Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-4 py-3 shadow-lg max-w-[200px]">
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary/40" style={{ background: 'linear-gradient(90deg, oklch(0.637 0.237 275 / 40%), oklch(0.7 0.2 310 / 40%))' }} />
            <span className="text-[10px] text-muted-foreground">AI connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-emerald-500/50" />
            <span className="text-[10px] text-muted-foreground">Manual link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
            <span className="text-[10px] text-muted-foreground">Knowledge node</span>
          </div>
          {/* Entity type colors — only show types present in the graph */}
          {allEntityTypes.length > 0 && (
            <>
              <div className="my-1 border-t border-border/30" />
              {allEntityTypes.slice(0, 6).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: getEntityTypeColor(type) }}
                  />
                  <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
                </div>
              ))}
              {allEntityTypes.length > 6 && (
                <span className="text-[10px] text-muted-foreground/60">
                  +{allEntityTypes.length - 6} more types
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onConnect={connectMode ? onConnect : undefined}
        onPaneClick={handlePaneClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        connectionLineStyle={{
          stroke: 'oklch(0.6 0.2 150 / 60%)',
          strokeWidth: 2,
          strokeDasharray: '6 3',
        }}
      >
        <Background
          color="oklch(0.637 0.237 275 / 8%)"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
        />
        <Controls className="!bg-card !border-border/50 !rounded-xl !shadow-lg" />
        <MiniMap
          className="!bg-card/80 !border-border/50 !rounded-xl"
          nodeColor={(node) => {
            const meta = nodeEntityMeta.get(node.id)
            return meta ? meta.color : ENTITY_TYPE_COLORS.default
          }}
          maskColor="oklch(0 0 0 / 50%)"
        />
      </ReactFlow>

      {/* Node Detail Sheet */}
      <Sheet open={!!selectedNodeId && !connectMode} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent className="w-[520px] sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
          {selectedDBNode && (() => {
            const nodeEntities = initialEntities.filter((e) => e.node_id === selectedDBNode.id)
            const nodeEdges = dbEdges.filter(
              (e) => e.source_id === selectedDBNode.id || e.target_id === selectedDBNode.id
            )
            const connectedNodeIds = nodeEdges.map((e) =>
              e.source_id === selectedDBNode.id ? e.target_id : e.source_id
            )
            const connectedNodes = initialNodes.filter((n) => connectedNodeIds.includes(n.id))
            const manualLinks = nodeEdges.filter((e) => e.is_manual)
            const autoLinks = nodeEdges.filter((e) => !e.is_manual)

            return (
              <>
                <SheetHeader className="mb-6 space-y-3">
                  <SheetTitle className="text-xl leading-tight pr-8">
                    {selectedDBNode.title}
                  </SheetTitle>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <a href={selectedDBNode.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                      <LinkIcon className="h-3 w-3" />
                      {(() => { try { return new URL(selectedDBNode.url).hostname.replace('www.', '') } catch { return selectedDBNode.url } })()}
                    </a>
                    {selectedDBNode.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedDBNode.created_at).toLocaleDateString()}
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
                      {selectedDBNode.summary}
                    </div>
                  </section>

                  <Separator className="bg-border/30" />

                  <section>
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      <Tag className="h-3.5 w-3.5" /> Entities ({nodeEntities.length})
                    </h3>
                    {nodeEntities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {nodeEntities.map((entity) => (
                          <Badge key={entity.id} variant="outline" className="text-xs px-2.5 py-1 bg-primary/10 text-primary border-primary/20">
                            {entity.name}
                            <span className="ml-1 opacity-60 text-[10px]">{entity.type}</span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No entities for this node.</p>
                    )}
                  </section>

                  <Separator className="bg-border/30" />

                  {/* Connected Nodes - split by type */}
                  <section>
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      <Network className="h-3.5 w-3.5" /> Connections ({connectedNodes.length})
                    </h3>

                    {autoLinks.length > 0 && (
                      <div className="mb-3">
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                          <Sparkles className="h-2.5 w-2.5" /> AI-discovered ({autoLinks.length})
                        </p>
                        <div className="space-y-1.5">
                          {autoLinks.map((edge) => {
                            const otherId = edge.source_id === selectedDBNode.id ? edge.target_id : edge.source_id
                            const other = initialNodes.find((n) => n.id === otherId)
                            if (!other) return null
                            return (
                              <div key={edge.id} className="flex items-center gap-3 rounded-lg bg-muted/50 border border-border/30 p-2.5 text-sm hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedNodeId(other.id)}>
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                <p className="font-medium truncate text-xs flex-1">{other.title}</p>
                                <span className="text-[10px] text-muted-foreground">{(edge.weight * 100).toFixed(0)}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {manualLinks.length > 0 && (
                      <div className="mb-3">
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                          <Hand className="h-2.5 w-2.5" /> Manual links ({manualLinks.length})
                        </p>
                        <div className="space-y-1.5">
                          {manualLinks.map((edge) => {
                            const otherId = edge.source_id === selectedDBNode.id ? edge.target_id : edge.source_id
                            const other = initialNodes.find((n) => n.id === otherId)
                            if (!other) return null
                            return (
                              <div key={edge.id} className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-sm">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                <p className="font-medium truncate text-xs flex-1 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedNodeId(other.id)}>{other.title}</p>
                                {edge.label && <span className="text-[10px] text-emerald-400/70">{edge.label}</span>}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => handleDeleteEdge(edge.id)}
                                  disabled={isPending}
                                >
                                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {connectedNodes.length === 0 && (
                      <p className="text-xs text-muted-foreground">No connections found.</p>
                    )}
                  </section>

                  <Button variant="outline" className="w-full gap-2 border-border/50" asChild>
                    <a href={selectedDBNode.url} target="_blank" rel="noreferrer">
                      Open Original Page <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function KnowledgeGraph(props: KnowledgeGraphProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner {...props} />
    </ReactFlowProvider>
  )
}
