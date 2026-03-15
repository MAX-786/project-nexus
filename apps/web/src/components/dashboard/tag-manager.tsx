'use client'

import type { DBTag } from '@nexus/shared'
import { Plus, X, Tags } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { getTags, createTag, deleteTag, addTagToNodes, removeTagFromNode, getNodeTags } from '@/app/dashboard/feed/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'


const TAG_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
]

interface TagManagerProps {
  nodeIds?: string[]
  onTagsChanged?: () => void
  trigger?: React.ReactNode
}

export function TagManager({ nodeIds, onTagsChanged, trigger }: TagManagerProps) {
  const [tags, setTags] = useState<DBTag[]>([])
  const [nodeTags, setNodeTags] = useState<{ node_id: string; tag_id: string }[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const loadData = useCallback(async () => {
    const [tagsResult, nodeTagsResult] = await Promise.all([getTags(), getNodeTags()])
    if (tagsResult.data) setTags(tagsResult.data)
    if (nodeTagsResult.data) setNodeTags(nodeTagsResult.data)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) loadData()
  }, [open, loadData])

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    setIsCreating(true)
    const result = await createTag(newTagName, selectedColor)
    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      setTags(prev => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTagName('')
      toast.success(`Tag "${result.data.name}" created`)
    }
    setIsCreating(false)
  }

  const handleDeleteTag = async (tagId: string) => {
    const result = await deleteTag(tagId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setTags(prev => prev.filter(t => t.id !== tagId))
      setNodeTags(prev => prev.filter(nt => nt.tag_id !== tagId))
      toast.success('Tag deleted')
      onTagsChanged?.()
    }
  }

  const handleToggleTag = async (tagId: string) => {
    if (!nodeIds?.length) return
    
    // Check if first node has this tag
    const hasTag = nodeTags.some(nt => nt.node_id === nodeIds[0] && nt.tag_id === tagId)
    
    if (hasTag) {
      // Remove tag from all selected nodes concurrently
      await Promise.all(nodeIds.map(nodeId => removeTagFromNode(nodeId, tagId)))
      setNodeTags(prev => prev.filter(nt => !(nodeIds.includes(nt.node_id) && nt.tag_id === tagId)))
    } else {
      // Add tag to all selected nodes
      const result = await addTagToNodes(nodeIds, tagId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      const newMappings = nodeIds.map(nid => ({ node_id: nid, tag_id: tagId }))
      setNodeTags(prev => [...prev, ...newMappings])
    }
    onTagsChanged?.()
  }

  const getNodeTagIds = () => {
    if (!nodeIds?.length) return new Set<string>()
    return new Set(nodeTags.filter(nt => nodeIds.includes(nt.node_id)).map(nt => nt.tag_id))
  }

  const activeTagIds = getNodeTagIds()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Tags className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tags</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {nodeIds?.length ? `Tag ${nodeIds.length} node${nodeIds.length > 1 ? 's' : ''}` : 'Manage Tags'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Create new tag */}
          <div className="flex gap-2">
            <Input
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Color picker */}
          <div className="flex gap-1.5">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-6 w-6 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Tags list */}
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center w-full">
                No tags yet. Create one above!
              </p>
            ) : (
              tags.map(tag => {
                const isActive = activeTagIds.has(tag.id)
                return (
                  <Badge
                    key={tag.id}
                    variant={isActive ? 'default' : 'outline'}
                    className="cursor-pointer gap-1 transition-all hover:scale-105"
                    style={isActive ? { backgroundColor: tag.color, borderColor: tag.color } : { borderColor: tag.color, color: tag.color }}
                    onClick={() => nodeIds?.length && handleToggleTag(tag.id)}
                  >
                    {tag.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTag(tag.id)
                      }}
                      className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Inline tag badges shown on node cards */
export function NodeTagBadges({ nodeId, tags, nodeTags }: { 
  nodeId: string
  tags: DBTag[]
  nodeTags: { node_id: string; tag_id: string }[] 
}) {
  const nodeTagIds = nodeTags.filter(nt => nt.node_id === nodeId).map(nt => nt.tag_id)
  const matchingTags = tags.filter(t => nodeTagIds.includes(t.id))
  
  if (matchingTags.length === 0) return null
  
  return (
    <div className="flex gap-1 flex-wrap">
      {matchingTags.slice(0, 3).map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}
        >
          {tag.name}
        </span>
      ))}
      {matchingTags.length > 3 && (
        <span className="text-[10px] text-muted-foreground">
          +{matchingTags.length - 3}
        </span>
      )}
    </div>
  )
}
