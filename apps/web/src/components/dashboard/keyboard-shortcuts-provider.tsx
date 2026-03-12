'use client'

import { Keyboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'


export function KeyboardShortcutsProvider() {
  const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts()

  return (
    <KeyboardShortcutsDialog
      open={showHelp}
      onOpenChange={setShowHelp}
      shortcuts={shortcuts}
    />
  )
}

/** Small button to show in the header */
export function KeyboardShortcutsHint() {
  const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts()

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowHelp(true)}
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Keyboard shortcuts <kbd className="ml-1 px-1 py-0.5 rounded border bg-gray-200 text-[10px]">?</kbd></p>
        </TooltipContent>
      </Tooltip>
      <KeyboardShortcutsDialog
        open={showHelp}
        onOpenChange={setShowHelp}
        shortcuts={shortcuts}
      />
    </>
  )
}
