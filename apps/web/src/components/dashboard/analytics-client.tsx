'use client'

import { useState } from 'react'
import {
  Brain,
  Tag,
  Network,
  GraduationCap,
  FolderOpen,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsSummary, AnalyticsDataPoint, EntityDistribution } from '@/lib/types'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ENTITY_COLORS: Record<string, string> = {
  person: 'bg-blue-500',
  concept: 'bg-purple-500',
  tool: 'bg-emerald-500',
  technology: 'bg-cyan-500',
  organization: 'bg-amber-500',
  location: 'bg-rose-500',
  event: 'bg-indigo-500',
  unknown: 'bg-muted-foreground',
}

function getEntityColor(type: string): string {
  return ENTITY_COLORS[type.toLowerCase()] ?? ENTITY_COLORS.unknown
}

function getTrend(data: AnalyticsDataPoint[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat'
  const mid = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, mid).reduce((s, d) => s + d.count, 0)
  const secondHalf = data.slice(mid).reduce((s, d) => s + d.count, 0)
  if (secondHalf > firstHalf * 1.1) return 'up'
  if (secondHalf < firstHalf * 0.9) return 'down'
  return 'flat'
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function formatShortDate(dateStr: string): string {
  // Parse as UTC to avoid timezone issues
  const parts = dateStr.split('-')
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/* ------------------------------------------------------------------ */
/*  Mini Bar Chart (CSS-based, no external lib)                        */
/* ------------------------------------------------------------------ */

function MiniBarChart({
  data,
  color = 'bg-primary',
  height = 80,
}: {
  data: AnalyticsDataPoint[]
  color?: string
  height?: number
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div
      className="flex items-end gap-[2px] w-full"
      style={{ height }}
      role="img"
      aria-label="Activity chart"
    >
      {data.map((d, i) => {
        const barHeight = Math.max((d.count / maxCount) * height, 2)
        return (
          <div
            key={i}
            className="group relative flex-1 flex flex-col items-center justify-end"
          >
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border border-border whitespace-nowrap z-10"
            >
              {d.count} · {formatShortDate(d.date)}
            </div>
            <div
              className={cn('w-full rounded-t-sm transition-all', color)}
              style={{ height: barHeight }}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Activity Heatmap                                                   */
/* ------------------------------------------------------------------ */

function ActivityHeatmap({ data }: { data: AnalyticsDataPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  function getIntensity(count: number): string {
    if (count === 0) return 'bg-muted'
    const ratio = count / maxCount
    if (ratio <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900'
    if (ratio <= 0.5) return 'bg-emerald-400 dark:bg-emerald-700'
    if (ratio <= 0.75) return 'bg-emerald-500 dark:bg-emerald-500'
    return 'bg-emerald-600 dark:bg-emerald-400'
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {data.map((d, i) => (
        <div
          key={i}
          className={cn(
            'w-4 h-4 rounded-sm transition-colors',
            getIntensity(d.count),
          )}
          title={`${formatShortDate(d.date)}: ${d.count} activities`}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Entity Distribution                                                */
/* ------------------------------------------------------------------ */

function EntityDistributionChart({ data }: { data: EntityDistribution[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">No entities extracted yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item) => {
        const pct = Math.round((item.count / total) * 100)
        return (
          <div key={item.type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize font-medium">{item.type}</span>
              <span className="text-muted-foreground">
                {item.count} ({pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getEntityColor(item.type))}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  subtitle?: string
  className?: string
}) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Analytics Client                                              */
/* ------------------------------------------------------------------ */

export default function AnalyticsClient({
  analytics,
}: {
  analytics: AnalyticsSummary
}) {
  const [range, setRange] = useState<7 | 30>(30)

  const nodesTrend = getTrend(analytics.nodesByDay)
  const reviewsTrend = getTrend(analytics.reviewsByDay)

  // Slice data to selected range
  const displayNodes = range === 7
    ? analytics.nodesByDay.slice(-7)
    : analytics.nodesByDay
  const displayReviews = range === 7
    ? analytics.reviewsByDay.slice(-7)
    : analytics.reviewsByDay

  const nodesInRange = displayNodes.reduce((s, d) => s + d.count, 0)
  const reviewsInRange = displayReviews.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={range === 7 ? 'default' : 'outline'}
            onClick={() => setRange(7)}
            className="h-7 text-xs"
          >
            7 days
          </Button>
          <Button
            size="sm"
            variant={range === 30 ? 'default' : 'outline'}
            onClick={() => setRange(30)}
            className="h-7 text-xs"
          >
            30 days
          </Button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Brain}
          label="Nodes"
          value={analytics.totalNodes}
          subtitle={`+${nodesInRange} this period`}
        />
        <StatCard
          icon={Tag}
          label="Entities"
          value={analytics.totalEntities}
        />
        <StatCard
          icon={Network}
          label="Connections"
          value={analytics.totalEdges}
        />
        <StatCard
          icon={GraduationCap}
          label="Reviews"
          value={analytics.totalReviews}
          subtitle={`${reviewsInRange} completed`}
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${analytics.streak}d`}
          subtitle={analytics.streak > 0 ? 'Keep it up!' : 'Start today'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Knowledge Growth */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Knowledge Growth</CardTitle>
              <div className="flex items-center gap-1.5">
                <TrendIcon trend={nodesTrend} />
                <Badge variant="secondary" className="text-xs">
                  +{nodesInRange} nodes
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={displayNodes} color="bg-primary" height={100} />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatShortDate(displayNodes[0]?.date ?? '')}</span>
              <span>{formatShortDate(displayNodes[displayNodes.length - 1]?.date ?? '')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Review Performance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Review Performance</CardTitle>
              <div className="flex items-center gap-1.5">
                <TrendIcon trend={reviewsTrend} />
                <Badge variant="secondary" className="text-xs">
                  {reviewsInRange} reviews
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={displayReviews} color="bg-emerald-500" height={100} />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatShortDate(displayReviews[0]?.date ?? '')}</span>
              <span>{formatShortDate(displayReviews[displayReviews.length - 1]?.date ?? '')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Entity Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <EntityDistributionChart data={analytics.entityDistribution} />
          </CardContent>
        </Card>

        {/* Weekly Activity Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityHeatmap data={analytics.weeklyActivity} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-muted" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <span>More</span>
              </div>

              {/* Collection Stats */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collections</span>
                  <span className="font-medium">{analytics.totalCollections}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
