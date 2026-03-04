import { create } from 'zustand'

interface UIState {
  /** Currently selected node ID (shared across Feed + Graph) */
  selectedNodeId: string | null

  /** Set the selected node (opens the detail sheet) */
  setSelectedNodeId: (id: string | null) => void
}

export const useUIStore = create<UIState>()((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}))
