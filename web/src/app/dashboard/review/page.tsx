import { createClient } from '@/utils/supabase/server'
import ReviewCards from '@/components/dashboard/review-cards'
import { GraduationCap, CheckCircle2, Inbox } from 'lucide-react'
import type { ReviewWithNode } from '@/lib/types'

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
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {reviews.length === 0 ? (
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {(totalCount ?? 0) > 0
                ? "You've reviewed all cards due today. Come back tomorrow for more."
                : "No cards in your review library yet. Capture some pages to get started."}
            </p>
          </div>
        ) : (
          <ReviewCards reviews={reviews} />
        )}
      </div>
    </div>
  )
}
