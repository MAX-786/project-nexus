import {
  Eye,
  RotateCcw,
  Frown,
  Smile,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Clock,
  ListOrdered,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { submitReview, snoozeReview } from '@/app/dashboard/review/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReviewWithNode } from '@/lib/types'

interface ReviewCardsProps {
  reviews: ReviewWithNode[]
}

const FLIP_ANIMATION_MS = 300

export default function ReviewCards({ reviews }: ReviewCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [completedCount, setCompletedCount] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  const current = reviews[currentIndex]
  const remaining = reviews.length - currentIndex

  function handleRate(rating: number) {
    if (!current) return

    startTransition(async () => {
      await submitReview(current.id, rating)
      setIsFlipping(true)
      setTimeout(() => {
        setRevealed(false)
        setIsFlipping(false)
        setCompletedCount(prev => prev + 1)
        if (currentIndex < reviews.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setCurrentIndex(reviews.length) // triggers "all done" state
        }
      }, FLIP_ANIMATION_MS)
    })
  }

  function handleSnooze(hours: number) {
    if (!current) return

    startTransition(async () => {
      const result = await snoozeReview(current.id, hours)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setIsFlipping(true)
      setTimeout(() => {
        setRevealed(false)
        setIsFlipping(false)
        toast.success(`Snoozed for ${hours === 1 ? '1 hour' : `${hours} hours`}`)
        if (currentIndex < reviews.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setCurrentIndex(reviews.length)
        }
      }, FLIP_ANIMATION_MS)
    })
  }

  // All done state
  if (!current) {
    return (
      <div className="text-center animate-nexus-fade-in">
        <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">🎉 Session Complete!</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
          You reviewed <span className="font-semibold text-foreground">{completedCount}</span> {completedCount === 1 ? 'card' : 'cards'}. Great work keeping your knowledge fresh!
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge variant="outline" className="gap-1 text-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
            <CheckCircle2 className="h-3 w-3" /> All caught up
          </Badge>
        </div>
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

      {/* Review Stats Bar */}
      <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {completedCount} done
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {remaining} remaining
          </span>
        </div>
        <button
          onClick={() => setShowQueue(!showQueue)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ListOrdered className="h-3 w-3" />
          {showQueue ? 'Hide' : 'Show'} queue
        </button>
      </div>

      {/* Queue Preview (#75) */}
      {showQueue && remaining > 1 && (
        <div className="mb-4 rounded-xl bg-muted/30 border border-border/30 p-3 space-y-1.5 animate-nexus-fade-in">
          <p className="text-xs font-medium text-muted-foreground mb-2">Upcoming cards:</p>
          {reviews.slice(currentIndex + 1, currentIndex + 4).map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground/60 w-4">{i + 2}.</span>
              <span className="truncate">{r.node.title}</span>
            </div>
          ))}
          {remaining > 4 && (
            <p className="text-xs text-muted-foreground/50 pl-6">
              +{remaining - 4} more
            </p>
          )}
        </div>
      )}

      {/* Flashcard */}
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden transition-all duration-300 ${isFlipping ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
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

      {/* Action buttons: Skip + Snooze */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {/* Snooze Option (#75) */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          onClick={() => handleSnooze(1)}
          disabled={isPending}
        >
          <Clock className="h-3 w-3" />
          Snooze 1h
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          onClick={() => handleSnooze(24)}
          disabled={isPending}
        >
          <Clock className="h-3 w-3" />
          Snooze 1d
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          onClick={() => {
            setIsFlipping(true)
            setTimeout(() => {
              setRevealed(false)
              setIsFlipping(false)
              if (currentIndex < reviews.length - 1) {
                setCurrentIndex(prev => prev + 1)
              }
            }, FLIP_ANIMATION_MS)
          }}
        >
          Skip <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
