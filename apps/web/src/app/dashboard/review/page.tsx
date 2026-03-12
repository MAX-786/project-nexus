import { GraduationCap } from 'lucide-react'

import { ReviewEmptyState } from '@/components/dashboard/empty-states'
import ReviewCardsLazy from '@/components/dashboard/review-cards-lazy'
import ReviewStreak from '@/components/dashboard/review-streak'
import type { ReviewWithNode } from '@/lib/types'
import { createClient } from '@/utils/supabase/server'

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

function computeWeeklyActivity(
  dates: string[],
): { date: string; count: number }[] {
  const today = new Date()
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const count = dates.filter((dt) => dt.startsWith(dayStr)).length
    result.push({ date: dayStr, count })
  }
  return result
}

export default async function ReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch reviews due today or earlier, joined with node data
  const now = new Date().toISOString()

  const { data: dueReviews, error } = await supabase
    .from('reviews')
    .select(`
      id,
      user_id,
      node_id,
      next_review_date,
      interval,
      ease_factor,
      last_reviewed_at,
      node:nodes!inner(id, title, summary, url)
    `)
    .eq('user_id', user.id)
    .lte('next_review_date', now)
    .order('next_review_date', { ascending: true })

  if (error) {
    console.error('Error fetching reviews:', error)
  }

  // Get total review count for stats
  const { count: totalCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch all last_reviewed_at values for streak and heatmap.
  // Limit to 90 days — streak can never exceed that window and the weekly
  // heatmap only needs 7 days, so fetching older rows is wasteful.
  const ninetyDaysAgo = new Date(Date.now() - 90 * MS_PER_DAY).toISOString()
  const { data: reviewHistory } = await supabase
    .from('reviews')
    .select('last_reviewed_at')
    .eq('user_id', user.id)
    .not('last_reviewed_at', 'is', null)
    .gte('last_reviewed_at', ninetyDaysAgo)
    .order('last_reviewed_at', { ascending: false })

  const reviewDates = (reviewHistory ?? []).map(
    (r: { last_reviewed_at: string | null }) => r.last_reviewed_at as string,
  )
  const streak = computeStreak(reviewDates)
  const weeklyActivity = computeWeeklyActivity(reviewDates)
  const totalReviewed = reviewDates.length

  const reviews: ReviewWithNode[] = (dueReviews ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    node: Array.isArray(r.node) ? r.node[0] : r.node,
  })) as ReviewWithNode[]

  return (
    <div className="flex h-full flex-col">
      {/* Review Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Spaced Repetition</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {reviews.length} {reviews.length === 1 ? 'card' : 'cards'} due for review
              {totalCount ? ` · ${totalCount} total in library` : ''}
            </p>
            <ReviewStreak
              streak={streak}
              totalReviewed={totalReviewed}
              weeklyActivity={weeklyActivity}
            />
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {reviews.length === 0 ? (
          <ReviewEmptyState hasAnyReviews={(totalCount ?? 0) > 0} />
        ) : (
          <ReviewCardsLazy reviews={reviews} />
        )}
      </div>
    </div>
  )
}
