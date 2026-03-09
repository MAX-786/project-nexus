'use client'

import {
  Bot,
  Brain,
  ChevronRight,
  Lightbulb,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { callMemoryAgent } from '@/lib/memory-agent'
import {
  useMemorySettings,
  PROVIDER_LABELS,
  DEFAULT_MODELS,
} from '@/lib/memory-settings'
import type { DBConsolidation, DBNode } from '@/lib/types'

import {
  deleteConsolidation,
  clearConsolidations,
  saveConsolidation,
  getUnconsolidatedNodes,
} from '@/app/dashboard/memory/actions'
import { MemoryEmptyState } from './empty-states'

// ─── Types ───────────────────────────────────────────────────────────────────

type NodePreview = Pick<DBNode, 'id' | 'title' | 'summary' | 'created_at'>

interface MemoryClientProps {
  consolidations: DBConsolidation[]
  nodes: NodePreview[]
  unconsolidatedCount: number
  themes: string[]
}

type Tab = 'insights' | 'query' | 'consolidate'

// ─── Consolidation Prompt Builder ────────────────────────────────────────────
// This builds the prompt the user sends to their BYOK LLM from the client.

function buildConsolidationPrompt(
  nodes: { id: string; title: string; summary: string }[],
): string {
  const nodeList = nodes
    .map((n, i) => `[Node ${i + 1} | id: ${n.id}]\nTitle: ${n.title}\nSummary: ${n.summary}`)
    .join('\n\n')

  return `You are a Memory Consolidation Agent. Analyze these captured knowledge nodes and find cross-cutting patterns, themes, and connections.

${nodeList}

Respond in EXACTLY this JSON format (no markdown, no extra text):
{
  "summary": "A 2-3 sentence synthesis of the key themes across all nodes",
  "insight": "One surprising or non-obvious connection you discovered",
  "themes": ["theme1", "theme2", "theme3"],
  "connections": [
    { "from_title": "Node A title", "to_title": "Node B title", "relationship": "how they connect" }
  ]
}`
}

function buildQueryPrompt(
  question: string,
  nodes: NodePreview[],
  consolidations: DBConsolidation[],
): string {
  const nodeList = nodes
    .slice(0, 30)
    .map(
      (n, i) =>
        `[Node ${i + 1}] ${n.title}: ${n.summary}`,
    )
    .join('\n')

  const insightList = consolidations
    .slice(0, 10)
    .map((c, i) => `[Insight ${i + 1}] ${c.summary} — ${c.insight}`)
    .join('\n')

  return `You are a Knowledge Query Agent for a personal knowledge base. Answer the user's question using ONLY the stored knowledge below. Reference specific nodes and insights by number. If no relevant knowledge exists, say so honestly.

## Stored Nodes
${nodeList || 'No nodes captured yet.'}

## Consolidated Insights
${insightList || 'No insights discovered yet.'}

## Question
${question}

Provide a clear, thorough answer with citations like [Node 1], [Insight 2], etc.`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract JSON from an AI response that may be wrapped in markdown code fences */
function extractJSON(text: string): string {
  // Try to extract JSON from ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Otherwise try to find a JSON object directly
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return text.trim()
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MemoryClient({
  consolidations: initialConsolidations,
  nodes,
  unconsolidatedCount: initialUnconsolidatedCount,
  themes: initialThemes,
}: MemoryClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('insights')
  const [consolidations, setConsolidations] = useState(initialConsolidations)
  const [unconsolidatedCount, setUnconsolidatedCount] = useState(
    initialUnconsolidatedCount,
  )
  const [themes] = useState(initialThemes)

  // Memory settings (Zustand — persisted in localStorage)
  const memorySettings = useMemorySettings()
  const isAutoReady = memorySettings.mode === 'auto' && memorySettings.apiKey.trim().length > 0

  // Consolidation state
  const [isConsolidating, startConsolidation] = useTransition()
  const [consolidationPrompt, setConsolidationPrompt] = useState('')
  const [consolidationResponse, setConsolidationResponse] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingSourceNodeIds, setPendingSourceNodeIds] = useState<string[]>([])
  const [isAutoConsolidating, setIsAutoConsolidating] = useState(false)

  // Query state
  const [queryInput, setQueryInput] = useState('')
  const [queryPrompt, setQueryPrompt] = useState('')
  const [queryResponse, setQueryResponse] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [showQueryPrompt, setShowQueryPrompt] = useState(false)
  const [isAutoQuerying, setIsAutoQuerying] = useState(false)
  const queryInputRef = useRef<HTMLInputElement>(null)

  // Delete state
  const [isPending, startTransition] = useTransition()

  // ─── Auto Mode: Consolidation ───────────────────────────────────────────

  const handleAutoConsolidate = useCallback(async () => {
    setIsAutoConsolidating(true)
    setActiveTab('consolidate')

    try {
      const result = await getUnconsolidatedNodes()
      if (result.error || !result.data) {
        toast.error(result.error ?? 'Failed to fetch nodes')
        return
      }

      if (result.data.length < 2) {
        toast.info('Need at least 2 unconsolidated nodes to consolidate')
        return
      }

      const batch = result.data.slice(0, 10)
      const nodeIds = batch.map((n: NodePreview) => n.id)
      const prompt = buildConsolidationPrompt(
        batch.map((n: NodePreview) => ({
          id: n.id,
          title: n.title,
          summary: n.summary ?? '',
        })),
      )

      setPendingSourceNodeIds(nodeIds)
      toast.info(`Consolidating ${batch.length} nodes with ${PROVIDER_LABELS[memorySettings.provider]}...`)

      const response = await callMemoryAgent({
        provider: memorySettings.provider,
        apiKey: memorySettings.apiKey,
        model: memorySettings.model || undefined,
        prompt,
      })

      if (response.error) {
        toast.error(response.error)
        return
      }

      const responseText = response.text || ''

      // Extract JSON from the response (handle markdown code fences)
      const jsonText = extractJSON(responseText)
      const parsed = JSON.parse(jsonText)
      const { summary, insight, themes: newThemes } = parsed

      if (!summary || !insight) {
        toast.error('AI response missing required "summary" or "insight" fields')
        setConsolidationResponse(responseText)
        setShowPrompt(true)
        return
      }

      const saveResult = await saveConsolidation({
        sourceNodeIds: nodeIds,
        summary,
        insight,
        themes: newThemes ?? [],
      })

      if (saveResult.error) {
        toast.error(saveResult.error)
        return
      }

      // Optimistic update
      setConsolidations((prev: DBConsolidation[]) => [
        {
          id: `temp-${Date.now()}`,
          user_id: '',
          source_node_ids: nodeIds,
          summary,
          insight,
          themes: newThemes ?? [],
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setUnconsolidatedCount((c: number) => Math.max(0, c - nodeIds.length))
      toast.success('Consolidation complete — insights discovered!')
      setActiveTab('insights')
    } catch (err) {
      toast.error(
        err instanceof SyntaxError
          ? 'AI response was not valid JSON. Try again or switch to Manual mode.'
          : 'Consolidation failed',
      )
    } finally {
      setIsAutoConsolidating(false)
    }
  }, [memorySettings.provider, memorySettings.apiKey, memorySettings.model])

  // ─── Auto Mode: Query ───────────────────────────────────────────────────

  const handleAutoQuery = useCallback(async () => {
    if (!queryInput.trim()) return
    setIsAutoQuerying(true)
    setQueryResponse('')

    try {
      const prompt = buildQueryPrompt(queryInput, nodes, consolidations)

      const response = await callMemoryAgent({
        provider: memorySettings.provider,
        apiKey: memorySettings.apiKey,
        model: memorySettings.model || undefined,
        prompt,
      })

      if (response.error) {
        toast.error(response.error)
        return
      }

      setQueryResponse(response.text || '')
      setIsQuerying(false)
    } catch {
      toast.error('Query failed')
    } finally {
      setIsAutoQuerying(false)
    }
  }, [queryInput, nodes, consolidations, memorySettings.provider, memorySettings.apiKey, memorySettings.model])

  // ─── Manual Mode: Consolidation ─────────────────────────────────────────

  const handlePrepareConsolidation = useCallback(async () => {
    const result = await getUnconsolidatedNodes()
    if (result.error || !result.data) {
      toast.error(result.error ?? 'Failed to fetch nodes')
      return
    }

    if (result.data.length < 2) {
      toast.info('Need at least 2 unconsolidated nodes to consolidate')
      return
    }

    const batch = result.data.slice(0, 10)
    const nodeIds = batch.map((n: NodePreview) => n.id)

    const prompt = buildConsolidationPrompt(
      batch.map((n: NodePreview) => ({
        id: n.id,
        title: n.title,
        summary: n.summary ?? '',
      })),
    )
    setPendingSourceNodeIds(nodeIds)
    setConsolidationPrompt(prompt)
    setConsolidationResponse('')
    setShowPrompt(true)
    setActiveTab('consolidate')
  }, [])

  const handleSaveConsolidation = useCallback(() => {
    if (!consolidationResponse.trim()) {
      toast.error('Paste the AI response first')
      return
    }

    startConsolidation(async () => {
      try {
        const jsonText = extractJSON(consolidationResponse)
        const parsed = JSON.parse(jsonText)
        const { summary, insight, themes: newThemes } = parsed

        if (!summary || !insight) {
          toast.error('Response must include "summary" and "insight" fields')
          return
        }

        const result = await saveConsolidation({
          sourceNodeIds: pendingSourceNodeIds,
          summary,
          insight,
          themes: newThemes ?? [],
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Consolidation saved!')
        setConsolidationResponse('')
        setShowPrompt(false)

        // Optimistic update
        setConsolidations((prev: DBConsolidation[]) => [
          {
            id: `temp-${Date.now()}`,
            user_id: '',
            source_node_ids: pendingSourceNodeIds,
            summary,
            insight,
            themes: newThemes ?? [],
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
        setUnconsolidatedCount((c: number) => Math.max(0, c - pendingSourceNodeIds.length))
        setPendingSourceNodeIds([])
        setActiveTab('insights')
      } catch {
        toast.error('Invalid JSON. Paste the raw JSON response from your AI.')
      }
    })
  }, [consolidationResponse, pendingSourceNodeIds])

  // ─── Manual Mode: Query ─────────────────────────────────────────────────

  const handlePrepareQuery = useCallback(() => {
    if (!queryInput.trim()) return

    const prompt = buildQueryPrompt(queryInput, nodes, consolidations)
    setQueryPrompt(prompt)
    setQueryResponse('')
    setShowQueryPrompt(true)
    setIsQuerying(true)
  }, [queryInput, nodes, consolidations])

  // ─── Delete Logic ────────────────────────────────────────────────────────

  const handleDeleteConsolidation = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await deleteConsolidation(id)
        if (result.error) {
          toast.error(result.error)
          return
        }
        setConsolidations((prev: DBConsolidation[]) => prev.filter((c) => c.id !== id))
        toast.success('Insight removed')
      })
    },
    [],
  )

  const handleClearAll = useCallback(() => {
    startTransition(async () => {
      const result = await clearConsolidations()
      if (result.error) {
        toast.error(result.error)
        return
      }
      setConsolidations([])
      toast.success('All insights cleared')
    })
  }, [])

  // ─── Derived Data ────────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      totalNodes: nodes.length,
      totalInsights: consolidations.length,
      pending: unconsolidatedCount,
      themes: themes.length,
    }),
    [nodes.length, consolidations.length, unconsolidatedCount, themes.length],
  )

  // ─── Render ──────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'insights',
      label: 'Insights',
      icon: <Lightbulb className="h-4 w-4" />,
    },
    {
      id: 'query',
      label: 'Ask Memory',
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: 'consolidate',
      label: 'Consolidate',
      icon: <Zap className="h-4 w-4" />,
    },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Stats Bar */}
      <div className="border-b border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-3">
          <StatCard
            icon={<Brain className="h-4.5 w-4.5 text-white" />}
            label="Total Nodes"
            value={stats.totalNodes}
            gradient="bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)]"
          />
          <StatCard
            icon={<Sparkles className="h-4.5 w-4.5 text-white" />}
            label="Insights Found"
            value={stats.totalInsights}
            gradient="bg-gradient-to-br from-[oklch(0.65_0.2_180)] to-[oklch(0.6_0.18_200)]"
          />
          <StatCard
            icon={<Zap className="h-4.5 w-4.5 text-white" />}
            label="Pending Consolidation"
            value={stats.pending}
            gradient="bg-gradient-to-br from-[oklch(0.75_0.15_60)] to-[oklch(0.7_0.18_40)]"
          />
          <StatCard
            icon={<Tag className="h-4.5 w-4.5 text-white" />}
            label="Themes Discovered"
            value={stats.themes}
            gradient="bg-gradient-to-br from-[oklch(0.7_0.2_310)] to-[oklch(0.65_0.22_340)]"
          />
        </div>
      </div>

      {/* Tab Navigation + Mode Badge */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <nav className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mode Badge */}
        <Link href="/dashboard/settings" className="group flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isAutoReady
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : 'bg-muted text-muted-foreground border border-border/50',
            )}
          >
            {isAutoReady ? (
              <>
                <Bot className="h-3 w-3" />
                Auto · {PROVIDER_LABELS[memorySettings.provider]}
              </>
            ) : (
              <>
                <Settings2 className="h-3 w-3" />
                Manual Mode
              </>
            )}
          </span>
        </Link>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'insights' && (
          <InsightsTab
            consolidations={consolidations}
            nodes={nodes}
            onDelete={handleDeleteConsolidation}
            onClearAll={handleClearAll}
            onConsolidate={isAutoReady ? handleAutoConsolidate : handlePrepareConsolidation}
            isPending={isPending}
            unconsolidatedCount={unconsolidatedCount}
            isAutoConsolidating={isAutoConsolidating}
          />
        )}

        {activeTab === 'query' && (
          <QueryTab
            queryInput={queryInput}
            setQueryInput={setQueryInput}
            queryPrompt={queryPrompt}
            queryResponse={queryResponse}
            setQueryResponse={setQueryResponse}
            isQuerying={isQuerying}
            setIsQuerying={setIsQuerying}
            showQueryPrompt={showQueryPrompt}
            onPrepareQuery={isAutoReady ? handleAutoQuery : handlePrepareQuery}
            queryInputRef={queryInputRef}
            isAutoReady={isAutoReady}
            isAutoQuerying={isAutoQuerying}
          />
        )}

        {activeTab === 'consolidate' && (
          <ConsolidateTab
            consolidationPrompt={consolidationPrompt}
            consolidationResponse={consolidationResponse}
            setConsolidationResponse={setConsolidationResponse}
            showPrompt={showPrompt}
            isConsolidating={isConsolidating}
            onPrepare={isAutoReady ? handleAutoConsolidate : handlePrepareConsolidation}
            onSave={handleSaveConsolidation}
            unconsolidatedCount={unconsolidatedCount}
            isAutoReady={isAutoReady}
            isAutoConsolidating={isAutoConsolidating}
          />
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: number
  gradient: string
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${gradient} shadow-sm`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  )
}

// ─── Insights Tab ────────────────────────────────────────────────────────────

function InsightsTab({
  consolidations,
  nodes,
  onDelete,
  onClearAll,
  onConsolidate,
  isPending,
  unconsolidatedCount,
  isAutoConsolidating,
}: {
  consolidations: DBConsolidation[]
  nodes: NodePreview[]
  onDelete: (id: string) => void
  onClearAll: () => void
  onConsolidate: () => void
  isPending: boolean
  unconsolidatedCount: number
  isAutoConsolidating: boolean
}) {
  if (consolidations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <MemoryEmptyState hasNodes={nodes.length > 0} />
        {nodes.length >= 2 && (
          <Button
            onClick={onConsolidate}
            disabled={isAutoConsolidating}
            className="mt-6 gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] text-white shadow-lg shadow-[oklch(0.637_0.237_275/20%)] hover:shadow-[oklch(0.637_0.237_275/40%)] transition-shadow border-0"
          >
            {isAutoConsolidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isAutoConsolidating
              ? 'Analyzing...'
              : `Consolidate ${unconsolidatedCount} nodes`}
          </Button>
        )}
      </div>
    )
  }

  // Build a lookup of node titles by ID
  const nodeTitleMap = new Map(nodes.map((n) => [n.id, n.title]))

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {unconsolidatedCount >= 2 && (
            <Button
              onClick={onConsolidate}
              disabled={isAutoConsolidating}
              size="sm"
              className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] text-white border-0"
            >
              {isAutoConsolidating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {isAutoConsolidating
                ? 'Analyzing...'
                : `Consolidate ${unconsolidatedCount} new nodes`}
            </Button>
          )}
        </div>
        {consolidations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            disabled={isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Insight Cards */}
      {consolidations.map((c) => (
        <InsightCard
          key={c.id}
          consolidation={c}
          nodeTitleMap={nodeTitleMap}
          onDelete={() => onDelete(c.id)}
          isPending={isPending}
        />
      ))}
    </div>
  )
}

function InsightCard({
  consolidation,
  nodeTitleMap,
  onDelete,
  isPending,
}: {
  consolidation: DBConsolidation
  nodeTitleMap: Map<string, string>
  onDelete: () => void
  isPending: boolean
}) {
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(
      new Date(consolidation.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    )
  }, [consolidation.created_at])

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)]">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Insight</CardTitle>
              <p className="text-xs text-muted-foreground min-h-[16px]">{date}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm leading-relaxed">{consolidation.summary}</p>

        {/* Key Insight */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Key Insight
            </span>
          </div>
          <p className="text-sm text-foreground/90">{consolidation.insight}</p>
        </div>

        {/* Themes */}
        {consolidation.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {consolidation.themes.map((theme) => (
              <Badge
                key={theme}
                variant="secondary"
                className="text-xs font-normal"
              >
                {theme}
              </Badge>
            ))}
          </div>
        )}

        {/* Source Nodes */}
        {consolidation.source_node_ids.length > 0 && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">
              Synthesized from {consolidation.source_node_ids.length} nodes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {consolidation.source_node_ids.slice(0, 6).map((nodeId) => (
                <span
                  key={nodeId}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-0.5"
                >
                  <ChevronRight className="h-3 w-3" />
                  {nodeTitleMap.get(nodeId)?.slice(0, 40) ??
                    nodeId.slice(0, 8)}
                </span>
              ))}
              {consolidation.source_node_ids.length > 6 && (
                <span className="text-xs text-muted-foreground">
                  +{consolidation.source_node_ids.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Query Tab ───────────────────────────────────────────────────────────────

function QueryTab({
  queryInput,
  setQueryInput,
  queryPrompt,
  queryResponse,
  setQueryResponse,
  isQuerying,
  setIsQuerying,
  showQueryPrompt,
  onPrepareQuery,
  queryInputRef,
  isAutoReady,
  isAutoQuerying,
}: {
  queryInput: string
  setQueryInput: (v: string) => void
  queryPrompt: string
  queryResponse: string
  setQueryResponse: (v: string) => void
  isQuerying: boolean
  setIsQuerying: (v: boolean) => void
  showQueryPrompt: boolean
  onPrepareQuery: () => void
  queryInputRef: React.RefObject<HTMLInputElement | null>
  isAutoReady: boolean
  isAutoQuerying: boolean
}) {
  const sampleQuestions = [
    'What are the main themes across my captures?',
    'What connections exist between my recent articles?',
    'Summarize everything I\'ve saved in 3 bullet points',
    'What should I focus on based on my knowledge base?',
  ]

  return (
    <div className="max-w-3xl space-y-6">
      {/* Query Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={queryInputRef}
            placeholder="Ask your knowledge base anything..."
            value={queryInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQueryInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onPrepareQuery()}
            className="pl-9"
            disabled={isAutoQuerying}
          />
        </div>
        <Button
          onClick={onPrepareQuery}
          disabled={!queryInput.trim() || isAutoQuerying}
          className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] text-white border-0"
        >
          {isAutoQuerying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isAutoQuerying ? 'Thinking...' : 'Ask'}
        </Button>
      </div>

      {/* Sample Questions */}
      {!showQueryPrompt && !queryResponse && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Try asking:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQueryInput(q)
                  queryInputRef.current?.focus()
                }}
                className="text-left text-sm text-muted-foreground hover:text-foreground rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto Mode: Loading indicator */}
      {isAutoQuerying && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <div>
                <p className="text-sm font-medium text-primary">Querying your knowledge base...</p>
                <p className="text-xs text-muted-foreground">AI is analyzing your nodes and insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Mode: Direct response display */}
      {isAutoReady && !isAutoQuerying && queryResponse && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Answer
              </span>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {queryResponse}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Mode: Prompt & Response (BYOK flow) */}
      {!isAutoReady && showQueryPrompt && (
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Step 1: Copy this prompt to your AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {queryPrompt}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(queryPrompt)
                    toast.success('Prompt copied!')
                  }}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Step 2: Paste the AI response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Paste the AI's response here..."
                value={queryResponse}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQueryResponse(e.target.value)}                rows={6}
                className="text-sm"
              />
              {queryResponse && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsQuerying(false)
                  }}
                >
                  Done
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Display response nicely */}
          {!isQuerying && queryResponse && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Answer
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {queryResponse}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Consolidate Tab ─────────────────────────────────────────────────────────

function ConsolidateTab({
  consolidationPrompt,
  consolidationResponse,
  setConsolidationResponse,
  showPrompt,
  isConsolidating,
  onPrepare,
  onSave,
  unconsolidatedCount,
  isAutoReady,
  isAutoConsolidating,
}: {
  consolidationPrompt: string
  consolidationResponse: string
  setConsolidationResponse: (v: string) => void
  showPrompt: boolean
  isConsolidating: boolean
  onPrepare: () => void
  onSave: () => void
  unconsolidatedCount: number
  isAutoReady: boolean
  isAutoConsolidating: boolean
}) {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Explanation */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)]">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                How Memory Consolidation Works
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Like how the brain consolidates memories during sleep, this
                feature reviews your unconsolidated captures and discovers
                cross-cutting themes, patterns, and non-obvious connections.
                {isAutoReady
                  ? ' Your AI provider is called directly from your browser — one click to discover insights.'
                  : ' Your API key stays in your browser — we generate a prompt that you send to your own AI.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Auto Mode: Loading state */}
      {isAutoConsolidating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <div>
                <p className="text-sm font-medium text-primary">Consolidating memories...</p>
                <p className="text-xs text-muted-foreground">AI is analyzing your nodes for cross-cutting patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Button */}
      {!showPrompt && !isAutoConsolidating && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-muted-foreground">
            {unconsolidatedCount >= 2
              ? `${unconsolidatedCount} nodes ready for consolidation`
              : 'Need at least 2 unconsolidated nodes to consolidate'}
          </p>
          <Button
            onClick={onPrepare}
            disabled={unconsolidatedCount < 2}
            size="lg"
            className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] text-white shadow-lg shadow-[oklch(0.637_0.237_275/20%)] hover:shadow-[oklch(0.637_0.237_275/40%)] transition-shadow border-0"
          >
            <Zap className="h-5 w-5" />
            {isAutoReady
              ? 'Consolidate with AI'
              : 'Generate Consolidation Prompt'}
          </Button>
          {!isAutoReady && (
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Switch to Auto mode in{' '}
              <Link href="/dashboard/settings" className="text-primary hover:underline">
                Settings
              </Link>{' '}
              for one-click AI-powered consolidation.
            </p>
          )}
        </div>
      )}

      {/* Manual BYOK Prompt Flow (only shown when not in auto mode) */}
      {!isAutoReady && showPrompt && (
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Step 1: Copy this prompt to your AI (ChatGPT, Claude, Gemini,
                etc.)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {consolidationPrompt}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(consolidationPrompt)
                    toast.success('Prompt copied!')
                  }}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Step 2: Paste the JSON response from your AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder='Paste the JSON response here... e.g. {"summary": "...", "insight": "...", "themes": [...]}'
                value={consolidationResponse}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsolidationResponse(e.target.value)}
                rows={8}
                className="text-sm font-mono"
              />
              <Button
                onClick={onSave}
                disabled={!consolidationResponse.trim() || isConsolidating}
                className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] text-white border-0"
              >
                {isConsolidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Save Consolidation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
