'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node as FlowNode,
  Edge as FlowEdge,
  BackgroundVariant
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Link as LinkIcon, Network } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

// Database Types
type DBNode = {
  id: string
  user_id: string
  url: string
  title: string
  summary: string
  raw_text: string
}

type DBEdge = {
  id: string
  source_id: string
  target_id: string
  relation_type: string
  weight: number
}

type DBEntity = {
  id: string
  name: string
  type: string
  user_id: string
}

interface GraphDashboardProps {
  initialNodes: DBNode[]
  initialEdges: DBEdge[]
  initialEntities: DBEntity[]
}

export default function GraphDashboard({
  initialNodes = [],
  initialEdges = [],
  initialEntities = [],
}: GraphDashboardProps) {
  
  // Sheet state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const selectedDBNode = initialNodes.find(n => n.id === selectedNodeId)

  // Map DB Nodes to React Flow Nodes
  const initialFlowNodes: FlowNode[] = useMemo(() => {
    return initialNodes.map((node, i) => {
      // Circular positioning math
      const count = initialNodes.length
      const r = 300 // radius
      const slice = (2 * Math.PI) / count
      const x = r * Math.cos(slice * i) + 400
      const y = r * Math.sin(slice * i) + 300

      return {
        id: node.id,
        position: { x, y },
        data: { label: node.title, summary: node.summary },
        style: {
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          width: 200,
          fontSize: '12px',
          fontWeight: 500,
        },
      }
    })
  }, [initialNodes])

  // Map DB Edges to React Flow Edges
  const initialFlowEdges: FlowEdge[] = useMemo(() => {
    return initialEdges.map((edge) => ({
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      animated: true,
      label: 'Similar',
      style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
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

  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    setSelectedNodeId(node.id)
  }, [])

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: Feed */}
      <div className="w-[400px] border-r bg-slate-50 flex flex-col items-center p-4">
        <h2 className="font-semibold text-lg py-2 self-start flex gap-2 items-center">
          <Network size={18} /> Feed
        </h2>
        
        {initialNodes.length === 0 ? (
          <div className="text-sm text-slate-500 text-center mt-10">
            No memories captured yet. Use the Nexus extension to save pages.
          </div>
        ) : (
          <ScrollArea className="w-full h-full pr-4">
            <div className="flex flex-col gap-4">
              {initialNodes.map((node) => (
                <Card 
                  key={node.id} 
                  className="cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md leading-tight">{node.title}</CardTitle>
                    <CardDescription className="text-xs truncate">{node.url}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {node.summary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Right Panel: Graph */}
      <div className="flex-1 h-full w-full bg-slate-50/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.2}
          maxZoom={4}
        >
          <Background color="#ccc" variant={BackgroundVariant.Dots} gap={24} size={2} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Right Drawer: Node Details */}
      <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent className="w-[500px] sm:max-w-xl overflow-y-auto">
          {selectedDBNode && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl leading-tight">
                  {selectedDBNode.title}
                </SheetTitle>
                <SheetDescription className="break-all mt-2 flex items-center gap-2">
                  <LinkIcon size={14} />
                  <a href={selectedDBNode.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    {selectedDBNode.url}
                  </a>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 text-slate-700">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    AI Summary
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-md border text-sm leading-relaxed">
                    {selectedDBNode.summary}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Entities Found (Global)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {initialEntities.length > 0 ? (
                      // Naive global mapping for sprint 4 since entities don't have node_id link currently in schema
                      initialEntities.map(e => (
                        <Badge key={e.id} variant="secondary">{e.name}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No entities extracted yet.</span>
                    )}
                  </div>
                </div>

                <div>
                   <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Raw Text Snippet
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-md border text-xs text-slate-500 font-mono h-40 overflow-hidden relative">
                    {selectedDBNode.raw_text?.substring(0, 500)}...
                    <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-slate-50 to-transparent" />
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" asChild>
                   <a href={selectedDBNode.url} target="_blank" rel="noreferrer">
                     Open Original Context <ExternalLink size={16} />
                   </a>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
