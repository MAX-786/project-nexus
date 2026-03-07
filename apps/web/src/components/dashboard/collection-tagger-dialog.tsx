'use client'

import { Check, Plus, Tag, Loader2 } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import {
  getCollections,
  createCollection,
  addNodesToCollection,
} from '@/app/dashboard/feed/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DBCollection } from '@/lib/types'

interface CollectionTaggerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedNodeIds: string[]
  onSuccess?: () => void
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
]

export function CollectionTaggerDialog({
  open,
  onOpenChange,
  selectedNodeIds,
  onSuccess,
}: CollectionTaggerDialogProps) {
  const [collections, setCollections] = useState<DBCollection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // New collection state
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[5])
  
  const [isSaving, startSaving] = useTransition()

  useEffect(() => {
    if (open) {
      loadCollections()
      setIsCreating(false)
      setNewName('')
    }
  }, [open])

  const loadCollections = async () => {
    setIsLoading(true)
    const result = await getCollections()
    if (result.data) {
      setCollections(result.data)
    }
    setIsLoading(false)
  }

  const handleCreateAndTag = async () => {
    if (!newName.trim()) return

    startSaving(async () => {
      // 1. Create collection
      const createRes = await createCollection(newName.trim(), newColor)
      if (createRes.error || !createRes.data) {
        toast.error(createRes.error || 'Failed to create collection')
        return
      }

      const newCol = createRes.data

      // 2. Tag nodes
      const tagRes = await addNodesToCollection(selectedNodeIds, newCol.id)
      if (tagRes.error) {
        toast.error(tagRes.error)
        return
      }

      toast.success(`Created "${newCol.name}" and added ${selectedNodeIds.length} nodes`)
      onOpenChange(false)
      onSuccess?.()
    })
  }

  const handleTagExisting = async (collectionId: string, collectionName: string) => {
    startSaving(async () => {
      const res = await addNodesToCollection(selectedNodeIds, collectionId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Added ${selectedNodeIds.length} nodes to "${collectionName}"`)
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Tag to Collection
          </DialogTitle>
          <DialogDescription>
            Organize {selectedNodeIds.length} selected node{selectedNodeIds.length === 1 ? '' : 's'} into a custom collection.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Create New Section */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
            {!isCreating ? (
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new collection
              </Button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-1">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Collection Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. ML Research" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${newColor === c ? 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewColor(c)}
                      >
                        {newColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button 
                    size="sm" 
                    onClick={handleCreateAndTag} 
                    disabled={!newName.trim() || isSaving}
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Create & Tag
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Collections */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Existing Collections
            </h4>
            <ScrollArea className="h-[180px] rounded-md border border-border/50 bg-card p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                  <Tag className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">No collections yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left"
                      onClick={() => handleTagExisting(col.id, col.name)}
                      disabled={isSaving}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: col.color || '#64748b' }} 
                        />
                        <span className="text-sm font-medium">{col.name}</span>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground opacity-50" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
