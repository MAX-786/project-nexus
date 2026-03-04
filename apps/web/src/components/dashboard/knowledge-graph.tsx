'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Network, ExternalLink, Clock, Tag, FileText, Link as LinkIcon } from 'lucide-react'

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
  return (
    <div className="group relative">
      <Handle type="target" position={Position.Left} className="!bg-primary !border-primary/50 !w-2 !h-2" />
      <div className="min-w-[180px] max-w-[220px] rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 p-3 shadow-lg shadow-black/20 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300 cursor-pointer">
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
      <Handle type="source" position={Position.Right} className="!bg-primary !border-primary/50 !w-2 !h-2" />
    </div>
  )
}

const nodeTypes = { nexusNode: NexusNode }

export default function KnowledgeGraph({
  initialNodes = [],
  initialEdges = [],
  initialEntities = [],
}: KnowledgeGraphProps) {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)
  const selectedDBNode = initialNodes.find((n) => n.id === selectedNodeId)

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
        },
      }
    })
  }, [initialNodes, initialEntities])

  // Map DB Edges to React Flow Edges
  const initialFlowEdges: FlowEdge[] = useMemo(() => {
    return initialEdges.map((edge) => ({
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      animated: true,
      style: {
        stroke: 'oklch(0.637 0.237 275 / 40%)',
        strokeWidth: 1.5,
      },
    }))
  }, [initialEdges])

  const [nodes, setNodes] = useState<FlowNode[]>(initialFlowNodes)
  const [edges, setEdges] = useState<FlowEdge[]>(initialFlowEdges)

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
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )

  if (initialNodes.length === 0) {
    return <GraphEmptyState />
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
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
      <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent className="w-[520px] sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
          {selectedDBNode && (() => {
            const nodeEntities = initialEntities.filter((e) => e.node_id === selectedDBNode.id)
            const connectedNodeIds = initialEdges
              .filter((e) => e.source_id === selectedDBNode.id || e.target_id === selectedDBNode.id)
              .map((e) => (e.source_id === selectedDBNode.id ? e.target_id : e.source_id))
            const connectedNodes = initialNodes.filter((n) => connectedNodeIds.includes(n.id))

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

                  <section>
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      <Network className="h-3.5 w-3.5" /> Connected ({connectedNodes.length})
                    </h3>
                    {connectedNodes.length > 0 ? (
                      <div className="space-y-2">
                        {connectedNodes.map((cn) => (
                          <div key={cn.id} className="flex items-center gap-3 rounded-lg bg-muted/50 border border-border/30 p-3 text-sm hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedNodeId(cn.id)}>
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <p className="font-medium truncate text-sm">{cn.title}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
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
