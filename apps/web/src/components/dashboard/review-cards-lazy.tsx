'use client'

import dynamic from 'next/dynamic'

import ReviewLoading from '@/app/dashboard/review/loading'
import type { ReviewWithNode } from '@/lib/types'

// `ssr: false` must live in a Client Component.
const ReviewCards = dynamic(() => import('./review-cards'), {
  ssr: false,
  loading: () => <ReviewLoading />,
})

interface Props {
  reviews: ReviewWithNode[]
}

export default function ReviewCardsLazy(props: Props) {
  return <ReviewCards {...props} />
}
