'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Keyboard } from 'lucide-react'

interface ShortcutItem {
  id: string
  label: string
  description: string
  category: string
}

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: ShortcutItem[]
}

export function KeyboardShortcutsDialog({ open, onOpenChange, shortcuts }: KeyboardShortcutsDialogProps) {
  const [modKey, setModKey] = useState('⌘')

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    setModKey(isMac ? '⌘' : 'Ctrl+')
  }, [])
  const categories = [
    { id: 'navigation', title: 'Navigation' },
    { id: 'actions', title: 'Actions' },
    { id: 'general', title: 'General' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {categories.map(cat => {
            const catShortcuts = shortcuts.filter(s => s.category === cat.id)
            if (catShortcuts.length === 0) return null
            return (
              <div key={cat.id}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{cat.title}</h4>
                <div className="space-y-1.5">
                  {catShortcuts.map(shortcut => (
                    <div key={shortcut.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                        {shortcut.label}
                      </kbd>
                    </div>
                  ))}
                </div>
                <Separator className="mt-3" />
              </div>
            )
          })}
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">{modKey}K</kbd> for search
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
