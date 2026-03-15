'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'

// SuperMemo-2 (SM-2) Algorithm
// https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
// Rating: 0 = Forgot, 1 = Hard, 2 = Good, 3 = Easy

export async function submitReview(reviewId: string, rating: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Fetch current review state
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !review) {
    return { error: 'Review not found' }
  }

  // SM-2 Calculation
  const { ease_factor, interval } = review

  // Map our 0-3 rating to SM-2's 0-5 quality scale
  // 0 (Forgot) -> q=0, 1 (Hard) -> q=2, 2 (Good) -> q=4, 3 (Easy) -> q=5
  const qualityMap: Record<number, number> = { 0: 0, 1: 2, 2: 4, 3: 5 }
  const quality = qualityMap[rating] ?? 0

  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let newEaseFactor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor) // Minimum EF is 1.3

  let newInterval: number

  if (quality < 3) {
    // Failed recall — reset interval
    newInterval = 1
  } else {
    // Successful recall
    if (interval === 0) {
      newInterval = 1
    } else if (interval === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      ease_factor: newEaseFactor,
      interval: newInterval,
      next_review_date: nextReviewDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard/review')
  return { success: true, nextInterval: newInterval }
}

// Snooze: defer a card's next review by 1 hour or 1 day without counting as reviewed
export async function snoozeReview(reviewId: string, duration: '1h' | '1d') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const msMap: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }

  const nextReviewDate = new Date(Date.now() + msMap[duration])

  const { error } = await supabase
    .from('reviews')
    .update({ next_review_date: nextReviewDate.toISOString() })
    .eq('id', reviewId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/review')
  return { success: true }
}
