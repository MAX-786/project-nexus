'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ShortcutAction {
  key: string
  label: string
  description: string
  category: 'navigation' | 'actions' | 'general'
  handler: () => void
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: ShortcutAction[] = [
    // Navigation
    { key: '1', label: '1', description: 'Go to Feed', category: 'navigation', handler: () => router.push('/dashboard/feed') },
    { key: '2', label: '2', description: 'Go to Graph', category: 'navigation', handler: () => router.push('/dashboard/graph') },
    { key: '3', label: '3', description: 'Go to Review', category: 'navigation', handler: () => router.push('/dashboard/review') },
    { key: '4', label: '4', description: 'Go to Memory', category: 'navigation', handler: () => router.push('/dashboard/memory') },
    { key: '5', label: '5', description: 'Go to Settings', category: 'navigation', handler: () => router.push('/dashboard/settings') },
    // General
    { key: '?', label: '?', description: 'Show keyboard shortcuts', category: 'general', handler: () => setShowHelp(prev => !prev) },
  ]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return

    const matchedShortcut = shortcuts.find(s => s.key === e.key)
    if (matchedShortcut) {
      e.preventDefault()
      matchedShortcut.handler()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { shortcuts, showHelp, setShowHelp }
}
