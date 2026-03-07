'use client'

import { useState, useTransition } from 'react'
import { submitReview } from '@/app/dashboard/review/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  RotateCcw,
  Frown,
  Smile,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'

import type { ReviewWithNode } from '@/lib/types'

interface ReviewCardsProps {
  reviews: ReviewWithNode[]
}

export default function ReviewCards({ reviews }: ReviewCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [completedCount, setCompletedCount] = useState(0)

  const current = reviews[currentIndex]

  function handleRate(rating: number) {
    if (!current) return

    startTransition(async () => {
      await submitReview(current.id, rating)
      setRevealed(false)
      setCompletedCount(prev => prev + 1)
      if (currentIndex < reviews.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setCurrentIndex(reviews.length) // triggers "all done" state
      }
    })
  }

  // All done state
  if (!current) {
    return (
      <div className="text-center animate-nexus-fade-in">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          You reviewed {completedCount} {completedCount === 1 ? 'card' : 'cards'}. Nice work!
        </p>
      </div>
    )
  }

  const ratingButtons = [
    { rating: 0, label: 'Forgot', icon: <RotateCcw className="h-4 w-4" />, variant: 'destructive' as const, hint: '1 day' },
    { rating: 1, label: 'Hard', icon: <Frown className="h-4 w-4" />, variant: 'outline' as const, hint: '1 day' },
    { rating: 2, label: 'Good', icon: <Smile className="h-4 w-4" />, variant: 'outline' as const, hint: `${Math.max(1, Math.round(current.interval * current.ease_factor))}d` },
    { rating: 3, label: 'Easy', icon: <Sparkles className="h-4 w-4" />, variant: 'default' as const, hint: `${Math.max(6, Math.round(current.interval * current.ease_factor * 1.3))}d` },
  ]

  function getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto animate-nexus-fade-in">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-[oklch(0.7_0.2_310)] rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex) / reviews.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          {currentIndex + 1} / {reviews.length}
        </span>
      </div>

      {/* Flashcard */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg leading-snug">
              {current.node.title}
            </CardTitle>
            <Badge variant="outline" className="shrink-0 text-xs border-border/50">
              {current.interval === 0 ? 'New' : `${current.interval}d interval`}
            </Badge>
          </div>
          <a
            href={current.node.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            {getDomainFromUrl(current.node.url)}
          </a>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary - masked or revealed */}
          <div className="relative">
            {!revealed ? (
              <div className="min-h-[120px] flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 border border-border/30 p-6">
                <p className="text-sm text-muted-foreground text-center">
                  Can you recall the key points from this article?
                </p>
                <Button
                  onClick={() => setRevealed(true)}
                  variant="outline"
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4" />
                  Reveal Summary
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/20 border border-border/30 p-4 animate-nexus-fade-in">
                <p className="text-sm leading-relaxed">{current.node.summary}</p>
              </div>
            )}
          </div>

          {/* Rating Buttons - only shown when revealed */}
          {revealed && (
            <div className="pt-2 animate-nexus-fade-in">
              <p className="text-xs text-muted-foreground text-center mb-3">
                How well did you recall this?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ratingButtons.map((btn) => (
                  <Button
                    key={btn.rating}
                    variant={btn.variant}
                    onClick={() => handleRate(btn.rating)}
                    disabled={isPending}
                    className="flex flex-col h-auto py-3 gap-1 text-xs"
                  >
                    {btn.icon}
                    <span className="font-medium">{btn.label}</span>
                    <span className="text-[10px] opacity-60">{btn.hint}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip button */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          onClick={() => {
            setRevealed(false)
            if (currentIndex < reviews.length - 1) {
              setCurrentIndex(prev => prev + 1)
            }
          }}
        >
          Skip <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
