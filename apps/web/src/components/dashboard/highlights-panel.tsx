'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Highlighter, Plus, MessageSquare } from 'lucide-react'
import { getHighlights, createHighlight, deleteHighlight, updateHighlightNote } from '@/app/dashboard/feed/actions'
import type { DBHighlight } from '@nexus/shared'

const HIGHLIGHT_COLORS = [
  { value: '#fbbf24', label: 'Yellow' },
  { value: '#34d399', label: 'Green' },
  { value: '#60a5fa', label: 'Blue' },
  { value: '#f472b6', label: 'Pink' },
  { value: '#a78bfa', label: 'Purple' },
]

interface HighlightsPanelProps {
  nodeId: string
}

export function HighlightsPanel({ nodeId }: HighlightsPanelProps) {
  const [highlights, setHighlights] = useState<DBHighlight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newText, setNewText] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newColor, setNewColor] = useState('#fbbf24')
  const [isCreating, setIsCreating] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState('')

  const loadHighlights = useCallback(async () => {
    setIsLoading(true)
    const result = await getHighlights(nodeId)
    if (result.data) setHighlights(result.data)
    setIsLoading(false)
  }, [nodeId])

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  const handleCreate = async () => {
    if (!newText.trim()) return
    setIsCreating(true)
    const result = await createHighlight(nodeId, newText, newNote, newColor)
    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      setHighlights(prev => [result.data!, ...prev])
      setNewText('')
      setNewNote('')
      setShowForm(false)
      toast.success('Highlight saved')
    }
    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteHighlight(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      setHighlights(prev => prev.filter(h => h.id !== id))
      toast.success('Highlight deleted')
    }
  }

  const handleSaveNote = async (id: string) => {
    const result = await updateHighlightNote(id, editNoteText)
    if (result.error) {
      toast.error(result.error)
    } else {
      setHighlights(prev => prev.map(h => h.id === id ? { ...h, note: editNoteText.trim() || null } : h))
      setEditingNoteId(null)
      toast.success('Note updated')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Highlighter className="h-4 w-4 text-amber-400" />
          Highlights
          {highlights.length > 0 && (
            <span className="text-xs text-muted-foreground">({highlights.length})</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="h-7 gap-1"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {showForm && (
        <Card className="border-amber-400/30 bg-amber-400/5">
          <CardContent className="p-3 space-y-2">
            <Textarea
              placeholder="Paste or type the highlighted text..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <Input
              placeholder="Add a note (optional)..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={`h-5 w-5 rounded-full transition-all ${newColor === c.value ? 'ring-2 ring-offset-1 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={!newText.trim() || isCreating}>
                  {isCreating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : highlights.length === 0 && !showForm ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No highlights yet. Save important passages from this page.
        </p>
      ) : (
        <div className="space-y-2">
          {highlights.map(h => (
            <Card key={h.id} className="group overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed italic">&ldquo;{h.text}&rdquo;</p>
                    {h.note && editingNoteId !== h.id && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        {h.note}
                      </p>
                    )}
                    {editingNoteId === h.id && (
                      <div className="mt-1.5 flex gap-1.5">
                        <Input
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="text-xs h-7"
                          placeholder="Add a note..."
                          autoFocus
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveNote(h.id)}>Save</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditingNoteId(h.id); setEditNoteText(h.note || '') }}
                      >
                        {h.note ? 'Edit note' : 'Add note'}
                      </button>
                      <button
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(h.id)}
                      >
                        Delete
                      </button>
                      <span className="text-[10px] text-muted-foreground/50 ml-auto">
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
