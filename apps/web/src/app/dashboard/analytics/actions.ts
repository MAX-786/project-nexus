'use server'

import { createClient } from '@/utils/supabase/server'

import type { AnalyticsDataPoint, EntityDistribution, AnalyticsSummary } from '@/lib/types'

const MS_PER_DAY = 86400000

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const uniqueDays = [
    ...new Set(dates.map((d) => new Date(d).toISOString().split('T')[0])),
  ]
    .sort()
    .reverse()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().split('T')[0]

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / MS_PER_DAY)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getDateRange(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function fillMissingDays(data: { date: string; count: number }[], days: number): AnalyticsDataPoint[] {
  const filled: AnalyticsDataPoint[] = []
  const dateMap = new Map(data.map((d) => [d.date, d.count]))
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    filled.push({ date: dayStr, count: dateMap.get(dayStr) ?? 0 })
  }

  return filled
}

export async function getAnalyticsSummary(range: number = 30): Promise<AnalyticsSummary | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const rangeStart = getDateRange(range)

  // Fetch counts in parallel
  const [
    nodesResult,
    entitiesResult,
    edgesResult,
    reviewsResult,
    collectionsResult,
    nodesTimeResult,
    reviewHistoryResult,
    entityTypesResult,
  ] = await Promise.all([
    supabase
      .from('nodes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('entities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('edges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // Nodes created in range
    supabase
      .from('nodes')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', rangeStart)
      .order('created_at', { ascending: true }),
    // Review history for streak and heatmap
    supabase
      .from('reviews')
      .select('last_reviewed_at')
      .eq('user_id', user.id)
      .not('last_reviewed_at', 'is', null)
      .order('last_reviewed_at', { ascending: false }),
    // Entity type distribution
    supabase
      .from('entities')
      .select('entity_type')
      .eq('user_id', user.id),
  ])

  // Process nodes by day
  const nodesByDayMap = new Map<string, number>()
  for (const node of nodesTimeResult.data ?? []) {
    const day = new Date(node.created_at).toISOString().split('T')[0]
    nodesByDayMap.set(day, (nodesByDayMap.get(day) ?? 0) + 1)
  }
  const nodesByDay = fillMissingDays(
    Array.from(nodesByDayMap.entries()).map(([date, count]) => ({ date, count })),
    range,
  )

  // Process reviews by day
  const reviewDates = (reviewHistoryResult.data ?? []).map(
    (r: { last_reviewed_at: string | null }) => r.last_reviewed_at as string,
  )
  const reviewsByDayMap = new Map<string, number>()
  for (const date of reviewDates) {
    const day = new Date(date).toISOString().split('T')[0]
    reviewsByDayMap.set(day, (reviewsByDayMap.get(day) ?? 0) + 1)
  }
  const reviewsByDay = fillMissingDays(
    Array.from(reviewsByDayMap.entries()).map(([date, count]) => ({ date, count })),
    range,
  )

  // Process entity distribution
  const entityTypeMap = new Map<string, number>()
  for (const entity of entityTypesResult.data ?? []) {
    const type = (entity as { entity_type: string }).entity_type || 'unknown'
    entityTypeMap.set(type, (entityTypeMap.get(type) ?? 0) + 1)
  }
  const entityDistribution: EntityDistribution[] = Array.from(entityTypeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // Streak calculation
  const streak = computeStreak(reviewDates)

  // Weekly activity (last 7 days)
  const weeklyActivity = fillMissingDays([], 7).map((d) => ({
    date: d.date,
    count: (nodesByDayMap.get(d.date) ?? 0) + (reviewsByDayMap.get(d.date) ?? 0),
  }))

  return {
    totalNodes: nodesResult.count ?? 0,
    totalEntities: entitiesResult.count ?? 0,
    totalEdges: edgesResult.count ?? 0,
    totalReviews: reviewsResult.count ?? 0,
    totalCollections: collectionsResult.count ?? 0,
    streak,
    nodesByDay,
    reviewsByDay,
    entityDistribution,
    weeklyActivity,
  }
}
