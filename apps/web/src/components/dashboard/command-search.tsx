'use client'

import { FileText, Search, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useNodesStore } from '@/stores/nodes-store'
import { useUIStore } from '@/stores/ui-store'

// ---- Helpers ----

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

/** Wraps matching substrings in <mark> tags for highlight */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase().trim()
  const idx = lowerText.indexOf(lowerQuery)

  if (idx === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded-sm px-0.5">{text.slice(idx, idx + lowerQuery.length)}</mark>
      {text.slice(idx + lowerQuery.length)}
    </>
  )
}

// ---- Component ----

export default function CommandSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const router = useRouter()

  const nodes = useNodesStore((s) => s.nodes)
  const entities = useNodesStore((s) => s.entities)
  const setSearchQuery = useNodesStore((s) => s.setSearchQuery)
  const setSelectedNodeId = useUIStore((s) => s.setSelectedNodeId)

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reset query when dialog closes
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setQuery('')
    }
  }, [])

  // Debounced filtering
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
    }, 300)
  }, [setSearchQuery])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return nodes.slice(0, 8) // Show recent nodes when no query

    return nodes.filter((node) => {
      if (node.title.toLowerCase().includes(q)) return true
      if (node.summary?.toLowerCase().includes(q)) return true
      const nodeEntities = entities.filter((e) => e.node_id === node.id)
      return nodeEntities.some((e) => e.name.toLowerCase().includes(q))
    })
  }, [query, nodes, entities])

  // Matching entities (unique by name)
  const matchingEntities = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const seen = new Set<string>()
    return entities
      .filter((e) => {
        if (seen.has(e.name.toLowerCase())) return false
        if (e.name.toLowerCase().includes(q)) {
          seen.add(e.name.toLowerCase())
          return true
        }
        return false
      })
      .slice(0, 5)
  }, [query, entities])

  // Handle selecting a node
  function handleSelectNode(nodeId: string) {
    setOpen(false)
    setSearchQuery('')
    setSelectedNodeId(nodeId)
    router.push('/dashboard/feed')
  }

  // Handle selecting an entity — sets search query to entity name
  function handleSelectEntity(entityName: string) {
    setOpen(false)
    setSearchQuery(entityName)
    router.push('/dashboard/feed')
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        id="command-search-trigger"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:border-border hover:text-foreground min-w-[200px]"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search Knowledge Base"
        description="Search across your captured nodes, entities, and summaries"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Search nodes, entities, summaries…"
          value={query}
          onValueChange={handleQueryChange}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          </CommandEmpty>

          {/* Nodes Group */}
          {filteredNodes.length > 0 && (
            <CommandGroup heading="Nodes">
              {filteredNodes.slice(0, 8).map((node) => (
                <CommandItem
                  key={node.id}
                  value={`node-${node.id}-${node.title}`}
                  onSelect={() => handleSelectNode(node.id)}
                  className="flex items-center gap-3 py-2.5"
                >
                  {getFaviconUrl(node.url) ? (
                    <img
                      src={getFaviconUrl(node.url)}
                      alt=""
                      width={16}
                      height={16}
                      className="shrink-0 rounded-sm"
                      loading="lazy"
                    />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      <HighlightMatch text={node.title} query={query} />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getDomain(node.url)}
                      {node.summary && ` · ${node.summary.slice(0, 60)}…`}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Entities Group */}
          {matchingEntities.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Entities">
                {matchingEntities.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    value={`entity-${entity.id}-${entity.name}`}
                    onSelect={() => handleSelectEntity(entity.name)}
                    className="flex items-center gap-3 py-2"
                  >
                    <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">
                        <HighlightMatch text={entity.name} query={query} />
                      </p>
                      <p className="truncate text-xs text-muted-foreground capitalize">
                        {entity.type}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer hint */}
        <div className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/80 bg-background/80 px-1 py-0.5 text-[10px] font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/80 bg-background/80 px-1 py-0.5 text-[10px] font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/80 bg-background/80 px-1 py-0.5 text-[10px] font-mono">esc</kbd>
            close
          </span>
        </div>
      </CommandDialog>
    </>
  )
}
