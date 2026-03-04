import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  /** Currently selected node ID (shared across Feed + Graph) */
  selectedNodeId: string | null

  /** Set the selected node (opens the detail sheet) */
  setSelectedNodeId: (id: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    }),
    {
      name: 'nexus-ui-store',
    }
  )
)
