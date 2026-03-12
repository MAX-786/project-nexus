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
} from 'lucide-react'
import React, { useState, useMemo, useCallback, useTransition, useEffect } from 'react'
import '@xyflow/react/dist/style.css'

import { toast } from 'sonner'

import { createManualEdge, deleteManualEdge } from '@/app/dashboard/graph/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

// Custom Node Component
function NexusNode({ data }: NodeProps) {
  const entityCount = (data.entities as DBEntity[])?.length ?? 0
  const isConnectMode = data.isConnectMode as boolean
  return (
    <div className="group relative">
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
        className={`min-w-[180px] max-w-[220px] rounded-xl bg-card/90 backdrop-blur-sm border p-3 shadow-lg shadow-black/20 transition-all duration-300 cursor-pointer ${
          isConnectMode
            ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/20'
            : 'border-border/50 hover:border-primary/40 hover:shadow-primary/10'
        }`}
      >
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1">
          {data.label as string}
        </p>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
          {data.summary as string}
        </p>
        {entityCount > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] text-primary/70">{entityCount} entities</span>
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

function KnowledgeGraphInner({
  initialNodes = [],
  initialEdges = [],
  initialEntities = [],
}: KnowledgeGraphProps) {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)
  const selectedDBNode = initialNodes.find((n) => n.id === selectedNodeId)
  const { fitView } = useReactFlow()

  // Connect mode state
  const [connectMode, setConnectMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  // Cluster pagination state
  const [showAll, setShowAll] = useState(false)

  // Track DB edges for manual edge detection
  const [dbEdges, setDbEdges] = useState<DBEdge[]>(initialEdges)

  // BFS cluster computation
  const isClusterActive = !showAll && !!selectedNodeId
  const clusterNodeIds = useMemo(() => {
    if (!isClusterActive || !selectedNodeId) return null
    return getLocalCluster(selectedNodeId, dbEdges, DEFAULT_CLUSTER_DEPTH)
  }, [isClusterActive, selectedNodeId, dbEdges])

  // Map DB Nodes to React Flow Nodes — use a grid layout instead of circular
  const initialFlowNodes: FlowNode[] = useMemo(() => {
    const cols = Math.max(3, Math.ceil(Math.sqrt(initialNodes.length)))
    const spacingX = 300
    const spacingY = 180

    return initialNodes.map((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)

      // Add slight random offset for organic feel
      const jitterX = Math.sin(i * 1337) * 40
      const jitterY = Math.cos(i * 7919) * 30

      return {
        id: node.id,
        type: 'nexusNode',
        position: {
          x: col * spacingX + jitterX + 100,
          y: row * spacingY + jitterY + 100,
        },
        data: {
          label: node.title,
          summary: node.summary,
          entities: initialEntities.filter((e) => e.node_id === node.id),
          isConnectMode: connectMode,
        },
      }
    })
  }, [initialNodes, initialEntities, connectMode])

  // Map DB Edges to React Flow Edges — distinguish manual vs auto
  const initialFlowEdges: FlowEdge[] = useMemo(() => {
    return dbEdges.map((edge) => {
      const isManual = edge.is_manual === true
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
          stroke: isManual ? 'oklch(0.6 0.2 150 / 70%)' : 'oklch(0.637 0.237 275 / 40%)',
          strokeWidth: isManual ? 2 : 1.5,
          strokeDasharray: isManual ? '6 3' : undefined,
        },
      }
    })
  }, [dbEdges])

  const [nodes, setNodes] = useState<FlowNode[]>(initialFlowNodes)
  const [edges, setEdges] = useState<FlowEdge[]>(initialFlowEdges)

  // Compute visible nodes/edges based on cluster filter
  const visibleNodes = useMemo(() => {
    if (!clusterNodeIds) return nodes
    return nodes.filter((n) => clusterNodeIds.has(n.id))
  }, [nodes, clusterNodeIds])

  const visibleEdges = useMemo(() => {
    if (!clusterNodeIds) return edges
    return edges.filter((e) => clusterNodeIds.has(e.source) && clusterNodeIds.has(e.target))
  }, [edges, clusterNodeIds])

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
      }
    },
    [setSelectedNodeId, connectMode]
  )

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
    <div className="h-full w-full relative" role="region" aria-label="Knowledge graph visualization">
      {/* Graph Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2" role="toolbar" aria-label="Graph controls">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 p-1 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={!connectMode ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSelectMode}
                aria-pressed={!connectMode}
                aria-label="Select mode: click nodes to view details"
              >
                <MousePointer2 className="h-3.5 w-3.5" aria-hidden="true" />
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
                aria-pressed={connectMode}
                aria-label="Connect mode: drag between nodes to create manual links"
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                Connect
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Drag between nodes to create manual links</TooltipContent>
          </Tooltip>
        </div>

        {/* Edge Stats */}
        <div className="flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 shadow-lg" role="status" aria-label={`${autoEdgeCount} AI connections, ${manualEdgeCount} manual connections`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-label={`${autoEdgeCount} AI-generated connections`}>
                <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
                {autoEdgeCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">AI-generated connections</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-3" aria-hidden="true" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-label={`${manualEdgeCount} manual connections`}>
                <Hand className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                {manualEdgeCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">Manual connections</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Cluster Controls — Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Node Count Indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 shadow-lg" role="status" aria-live="polite">
          <Network className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
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
              aria-label="Dismiss edge selection"
            >
              Dismiss
            </Button>
          </div>
        )
      })()}

      {/* Graph Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 px-4 py-3 shadow-lg" role="note" aria-label="Graph legend">
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary/40" style={{ background: 'linear-gradient(90deg, oklch(0.637 0.237 275 / 40%), oklch(0.7 0.2 310 / 40%))' }} aria-hidden="true" />
            <span className="text-[10px] text-muted-foreground">AI connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-emerald-500/50" aria-hidden="true" />
            <span className="text-[10px] text-muted-foreground">Manual link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary/60" aria-hidden="true" />
            <span className="text-[10px] text-muted-foreground">Knowledge node</span>
          </div>
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
          nodeColor="oklch(0.637 0.237 275 / 60%)"
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
                    <a href={selectedDBNode.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline" aria-label={`Open source page: ${(() => { try { return new URL(selectedDBNode.url).hostname.replace('www.', '') } catch { return selectedDBNode.url } })()} (opens in new tab)`}>
                      <LinkIcon className="h-3 w-3" aria-hidden="true" />
                      {(() => { try { return new URL(selectedDBNode.url).hostname.replace('www.', '') } catch { return selectedDBNode.url } })()}
                    </a>
                    {selectedDBNode.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
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
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                                <p className="font-medium truncate text-xs flex-1 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedNodeId(other.id)}>{other.title}</p>
                                {edge.label && <span className="text-[10px] text-emerald-400/70">{edge.label}</span>}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => handleDeleteEdge(edge.id)}
                                  disabled={isPending}
                                  aria-label={`Remove manual link to ${other.title}`}
                                >
                                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Link2Off className="h-3 w-3" aria-hidden="true" />}
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
                    <a href={selectedDBNode.url} target="_blank" rel="noreferrer" aria-label={`Open original page: ${selectedDBNode.title} (opens in new tab)`}>
                      Open Original Page <ExternalLink className="h-4 w-4" aria-hidden="true" />
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
