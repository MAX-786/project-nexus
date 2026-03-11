import { create } from 'zustand'

import type { DBNode, DBEntity, DBEdge } from '@/lib/types'

interface NodesState {
  nodes: DBNode[]
  entities: DBEntity[]
  edges: DBEdge[]

  /** Client-side search query for the feed */
  searchQuery: string

  // ---- Actions ----

  /** Bulk-hydrate from server data */
  hydrate: (data: { nodes: DBNode[]; entities: DBEntity[]; edges: DBEdge[] }) => void

  /** Optimistically remove a node (and its related entities/edges) */
  removeNode: (nodeId: string) => void

  /** Optimistically update a node's title and/or summary */
  updateNode: (nodeId: string, updates: { title?: string; summary?: string }) => void

  /** Optimistically toggle a node's bookmark state */
  toggleBookmark: (nodeId: string) => void

  /** Update search query */
  setSearchQuery: (query: string) => void
}

export const useNodesStore = create<NodesState>()((set) => ({
  nodes: [],
  entities: [],
  edges: [],
  searchQuery: '',

  hydrate: ({ nodes, entities, edges }) =>
    set({ nodes, entities, edges }),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      entities: state.entities.filter((e) => e.node_id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source_id !== nodeId && e.target_id !== nodeId
      ),
    })),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    })),

  toggleBookmark: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, is_bookmarked: !(n.is_bookmarked ?? false) } : n
      ),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
}))

// ---- Derived selectors (use outside the store for memoised reads) ----

/** Returns nodes filtered by the current search query */
export function useFilteredNodes() {
  const nodes = useNodesStore((s) => s.nodes)
  const entities = useNodesStore((s) => s.entities)
  const query = useNodesStore((s) => s.searchQuery).toLowerCase().trim()

  if (!query) return nodes

  return nodes.filter((node) => {
    if (node.title.toLowerCase().includes(query)) return true
    if (node.summary?.toLowerCase().includes(query)) return true
    // Also match entity names attached to this node
    const nodeEntities = entities.filter((e) => e.node_id === node.id)
    return nodeEntities.some((e) => e.name.toLowerCase().includes(query))
  })
}
