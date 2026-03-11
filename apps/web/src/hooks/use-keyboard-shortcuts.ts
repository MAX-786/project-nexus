'use client'

import { useEffect, useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSettings } from '@/components/dashboard/settings-provider'
import { useNodesStore, useFilteredNodes } from '@/stores/nodes-store'
import { useUIStore } from '@/stores/ui-store'
import { deleteNode, toggleBookmark } from '@/app/dashboard/feed/actions'
import { toast } from 'sonner'

export type ShortcutId =
  | 'go_to_feed'
  | 'go_to_graph'
  | 'go_to_review'
  | 'go_to_memory'
  | 'go_to_settings'
  | 'nav_up'
  | 'nav_down'
  | 'open_node'
  | 'close_modal'
  | 'toggle_bookmark'
  | 'delete_node'
  | 'show_help'

interface ShortcutAction {
  id: ShortcutId
  defaultKey: string
  label: string
  description: string
  category: 'navigation' | 'actions' | 'general'
  handler: () => void
}

const DEFAULT_SHORTCUTS: Record<ShortcutId, string> = {
  go_to_feed: 'g f',
  go_to_graph: 'g g',
  go_to_review: 'g r',
  go_to_memory: 'g m',
  go_to_settings: 'g s',
  nav_up: 'k',
  nav_down: 'j',
  open_node: 'Enter',
  close_modal: 'Escape',
  toggle_bookmark: 'b',
  delete_node: 'd',
  show_help: '?',
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  const { settings } = useSettings()
  const [showHelp, setShowHelp] = useState(false)
  const [, startTransition] = useTransition()

  // For sequences like "g f"
  const [sequence, setSequence] = useState<string[]>([])

  const selectedNodeId = useUIStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)
  const nodes = useNodesStore((s) => s.nodes)
  const filteredNodes = useFilteredNodes()

  const removeNodeFromStore = useNodesStore((s) => s.removeNode)
  const toggleBookmarkInStore = useNodesStore((s) => s.toggleBookmark)

  const shortcuts: ShortcutAction[] = useMemo(() => [
    {
      id: 'go_to_feed',
      defaultKey: DEFAULT_SHORTCUTS['go_to_feed'],
      label: 'G then F',
      description: 'Go to Feed',
      category: 'navigation',
      handler: () => router.push('/dashboard/feed'),
    },
    {
      id: 'go_to_graph',
      defaultKey: DEFAULT_SHORTCUTS['go_to_graph'],
      label: 'G then G',
      description: 'Go to Graph',
      category: 'navigation',
      handler: () => router.push('/dashboard/graph'),
    },
    {
      id: 'go_to_review',
      defaultKey: DEFAULT_SHORTCUTS['go_to_review'],
      label: 'G then R',
      description: 'Go to Review',
      category: 'navigation',
      handler: () => router.push('/dashboard/review'),
    },
    {
      id: 'go_to_memory',
      defaultKey: DEFAULT_SHORTCUTS['go_to_memory'],
      label: 'G then M',
      description: 'Go to Memory',
      category: 'navigation',
      handler: () => router.push('/dashboard/memory'),
    },
    {
      id: 'go_to_settings',
      defaultKey: DEFAULT_SHORTCUTS['go_to_settings'],
      label: 'G then S',
      description: 'Go to Settings',
      category: 'navigation',
      handler: () => router.push('/dashboard/settings'),
    },
    {
      id: 'nav_up',
      defaultKey: DEFAULT_SHORTCUTS['nav_up'],
      label: 'K',
      description: 'Navigate up in feed',
      category: 'actions',
      handler: () => {
        if (pathname !== '/dashboard/feed') return
        if (!selectedNodeId) {
          if (filteredNodes.length > 0) setSelectedNodeId(filteredNodes[0].id)
          return
        }
        const index = filteredNodes.findIndex(n => n.id === selectedNodeId)
        if (index > 0) setSelectedNodeId(filteredNodes[index - 1].id)
      },
    },
    {
      id: 'nav_down',
      defaultKey: DEFAULT_SHORTCUTS['nav_down'],
      label: 'J',
      description: 'Navigate down in feed',
      category: 'actions',
      handler: () => {
        if (pathname !== '/dashboard/feed') return
        if (!selectedNodeId) {
          if (filteredNodes.length > 0) setSelectedNodeId(filteredNodes[0].id)
          return
        }
        const index = filteredNodes.findIndex(n => n.id === selectedNodeId)
        if (index >= 0 && index < filteredNodes.length - 1) setSelectedNodeId(filteredNodes[index + 1].id)
      },
    },
    {
      id: 'open_node',
      defaultKey: DEFAULT_SHORTCUTS['open_node'],
      label: 'Enter',
      description: 'Open selected node details',
      category: 'actions',
      handler: () => {
        // Just keeping it for semantic value; UI already responds to selectedNodeId globally
        // For actual triggering, Enter can be used if we implement focus logic, but we select via ID directly.
      },
    },
    {
      id: 'close_modal',
      defaultKey: DEFAULT_SHORTCUTS['close_modal'],
      label: 'Escape',
      description: 'Close panes or help',
      category: 'actions',
      handler: () => {
        if (showHelp) setShowHelp(false)
        else if (selectedNodeId) setSelectedNodeId(null)
      },
    },
    {
      id: 'toggle_bookmark',
      defaultKey: DEFAULT_SHORTCUTS['toggle_bookmark'],
      label: 'B',
      description: 'Toggle bookmark on selected node',
      category: 'actions',
      handler: () => {
        if (!selectedNodeId) return
        toggleBookmarkInStore(selectedNodeId)
        startTransition(() => {
          toggleBookmark(selectedNodeId)
        })
      },
    },
    {
      id: 'delete_node',
      defaultKey: DEFAULT_SHORTCUTS['delete_node'],
      label: 'D',
      description: 'Delete selected node',
      category: 'actions',
      handler: () => {
        if (!selectedNodeId) return
        startTransition(async () => {
          const result = await deleteNode(selectedNodeId)
          if (result.error) {
            toast.error(result.error)
          } else {
            removeNodeFromStore(selectedNodeId)
            toast.success('Node deleted via shortcut')
            setSelectedNodeId(null)
          }
        })
      },
    },
    {
      id: 'show_help',
      defaultKey: DEFAULT_SHORTCUTS['show_help'],
      label: '?',
      description: 'Show keyboard shortcuts',
      category: 'general',
      handler: () => setShowHelp(prev => !prev),
    },
  ], [
    router, 
    pathname, 
    selectedNodeId, 
    filteredNodes, 
    setSelectedNodeId, 
    showHelp, 
    setShowHelp, 
    toggleBookmarkInStore,
    removeNodeFromStore,
  ])

  // Get active keybinding mapping
  const activeKeyBindings = useMemo(() => {
    const map = new Map<string, typeof shortcuts[number]>()
    shortcuts.forEach(shortcut => {
      // Use custom shortcut if set, otherwise default
      const keyBinding = settings.custom_shortcuts?.[shortcut.id] || shortcut.defaultKey
      map.set(keyBinding.toLowerCase(), shortcut)
    })
    return map
  }, [shortcuts, settings.custom_shortcuts])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!settings.shortcuts_enabled) return

    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      // Only allow Escape to blur inputs
      if (e.key === 'Escape') {
        target.blur()
      }
      return
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return

    const key = e.key.toLowerCase()
    const newSeq = [...sequence, key].slice(-2) // Keep last 2 keystrokes for sequences
    const sequenceStr = newSeq.join(' ')

    // First check for multi-key sequence match
    if (activeKeyBindings.has(sequenceStr)) {
      e.preventDefault()
      activeKeyBindings.get(sequenceStr)?.handler()
      setSequence([])
      return
    }

    // Check single key match
    if (activeKeyBindings.has(key)) {
      e.preventDefault()
      activeKeyBindings.get(key)?.handler()
      setSequence([])
      return
    }

    // Keep sequence alive if it's potentially part of a multi-key binding (e.g. 'g')
    const isPartialSequence = Array.from(activeKeyBindings.keys()).some(kb => kb.startsWith(key + ' '))
    if (isPartialSequence) {
      setSequence([key])
      
      // Auto clear sequence after 1.5 seconds if unbound
      setTimeout(() => setSequence([]), 1500)
    } else {
      setSequence([])
    }

  }, [activeKeyBindings, sequence, settings.shortcuts_enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { shortcuts, showHelp, setShowHelp, activeKeyBindings }
}
