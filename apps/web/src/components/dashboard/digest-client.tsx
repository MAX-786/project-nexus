'use client'

import { useState } from 'react'
import {
  Bot,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  Newspaper,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMemorySettings } from '@/lib/memory-settings'
import { callMemoryAgent } from '@/lib/memory-agent'

import {
  saveDigest,
  markDigestRead,
  markAllDigestsRead,
  deleteDigest,
  buildDigestPrompt,
} from '@/app/dashboard/digest/actions'

import type { DBDailyDigest } from '@/lib/types'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DigestClientProps {
  initialDigests: DBDailyDigest[]
  recentNodes: { id: string; title: string; summary: string; url: string; created_at: string }[]
  unreadCount: number
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DigestClient({
  initialDigests,
  recentNodes,
  unreadCount: initialUnread,
}: DigestClientProps) {
  const [digests, setDigests] = useState(initialDigests)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { provider, apiKey, model, mode } = useMemorySettings()
  const isAutoReady = mode === 'auto' && !!apiKey

  /* ---- Generate Digest ---- */

  async function handleGenerate() {
    if (recentNodes.length === 0) {
      toast.info('No recent captures in the last 24 hours')
      return
    }

    if (mode === 'auto' && !isAutoReady) {
      toast.error('Configure your API key in Settings → Memory Agent')
      return
    }

    setIsGenerating(true)

    try {
      const prompt = buildDigestPrompt(recentNodes)

      if (mode === 'auto') {
        const result = await callMemoryAgent({
          provider,
          apiKey,
          model,
          prompt,
        })

        if ('error' in result) {
          toast.error(result.error)
          return
        }

        // Parse response
        let parsed: { content: string; insights: string[] }
        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/)
          parsed = JSON.parse(jsonMatch?.[0] ?? result.text)
        } catch {
          toast.error('Failed to parse AI response')
          return
        }

        const saveResult = await saveDigest({
          content: parsed.content,
          nodeIds: recentNodes.map((n) => n.id),
          insights: parsed.insights ?? [],
        })

        if ('error' in saveResult) {
          toast.error(saveResult.error as string)
          return
        }

        // Add to local state
        const newDigest: DBDailyDigest = {
          id: crypto.randomUUID(),
          user_id: '',
          content: parsed.content,
          node_ids: recentNodes.map((n) => n.id),
          insights: parsed.insights ?? [],
          is_read: false,
          created_at: new Date().toISOString(),
        }

        setDigests((prev) => [newDigest, ...prev])
        setUnreadCount((c) => c + 1)
        toast.success('Digest generated!')
      } else {
        // Manual mode: copy prompt to clipboard
        await navigator.clipboard.writeText(prompt)
        toast.success('Prompt copied to clipboard. Paste it into your LLM.')
      }
    } catch (err) {
      toast.error('Failed to generate digest')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  /* ---- Mark Read ---- */

  async function handleMarkRead(digestId: string) {
    const result = await markDigestRead(digestId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDigests((prev) =>
      prev.map((d) => (d.id === digestId ? { ...d, is_read: true } : d)),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function handleMarkAllRead() {
    const result = await markAllDigestsRead()
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDigests((prev) => prev.map((d) => ({ ...d, is_read: true })))
    setUnreadCount(0)
    toast.success('All digests marked as read')
  }

  /* ---- Delete ---- */

  async function handleDelete(digestId: string) {
    const result = await deleteDigest(digestId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDigests((prev) => prev.filter((d) => d.id !== digestId))
    toast.success('Digest deleted')
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {recentNodes.length} captures in last 24h
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark all read
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || recentNodes.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            Generate Digest
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {digests.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No digests yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Capture some content with the browser extension, then generate your
              first daily digest to see AI-powered summaries and insights.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Digest List */}
      {digests.map((digest) => {
        const isExpanded = expandedId === digest.id
        const date = new Date(digest.created_at)

        return (
          <Card
            key={digest.id}
            className={cn(
              'transition-all',
              !digest.is_read && 'border-primary/30 bg-primary/5',
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">
                    {date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </CardTitle>
                  {!digest.is_read && (
                    <Badge variant="default" className="text-xs h-5">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {digest.node_ids.length} nodes
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleDelete(digest.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/90">{digest.content}</p>

              {/* Insights */}
              {digest.insights.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : digest.id)
                    }
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {digest.insights.length} insights
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>

                  {isExpanded && (
                    <ul className="space-y-1.5 pl-5">
                      {digest.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground list-disc"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Mark read button */}
              {!digest.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => handleMarkRead(digest.id)}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark as read
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
