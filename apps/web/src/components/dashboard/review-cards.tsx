'use client'

import {
  Eye,
  RotateCcw,
  Frown,
  Smile,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Target,
  Tag,
  Zap,
} from 'lucide-react'
import { useState, useTransition, useRef, useEffect, useCallback } from 'react'

import { submitReview, snoozeReview } from '@/app/dashboard/review/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ReviewWithNode } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const FLIP_MS = 500
const DEFAULT_DAILY_GOAL = 10
const GOAL_STORAGE_KEY = 'nexus-review-daily-goal'

// ─── Web Audio singleton ──────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null
function getAudioContext(): AudioContext | null {
  try {
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new AudioContext()
    }
    return _audioCtx
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gain = 0.15,
) {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.frequency.value = freq
  osc.type = 'sine'
  gainNode.gain.setValueAtTime(gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playRatingSound(rating: number) {
  const ctx = getAudioContext()
  if (!ctx) return
  const t = ctx.currentTime
  if (rating >= 2) {
    playTone(ctx, 523, t, 0.12)
    playTone(ctx, 659, t + 0.13, 0.12)
  } else {
    playTone(ctx, 220, t, 0.18, 0.1)
  }
}

function playCompletionSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  const t = ctx.currentTime
  playTone(ctx, 523, t, 0.1)
  playTone(ctx, 659, t + 0.1, 0.1)
  playTone(ctx, 784, t + 0.2, 0.15)
  playTone(ctx, 1047, t + 0.35, 0.2)
}

// ─── Confetti dots ────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  'bg-primary',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-pink-400',
  'bg-sky-400',
]

function ConfettiDot({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
  const sizes = [8, 10, 12]
  const size = sizes[index % 3]
  return (
    <span
      className={cn('absolute rounded-full animate-nexus-confetti', color)}
      style={{
        width: size,
        height: size,
        left: `${8 + index * 9}%`,
        top: 0,
        animationDelay: `${index * 55}ms`,
        animationDuration: `${700 + (index % 3) * 150}ms`,
      }}
    />
  )
}

// ─── Queue Preview ────────────────────────────────────────────────────────────

function QueuePreview({ upcoming }: { upcoming: ReviewWithNode[] }) {
  if (upcoming.length === 0) return null
  return (
    <div className="mt-5 animate-nexus-fade-in">
      <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
        <Zap className="h-3 w-3" /> Up next
      </p>
      <div className="flex flex-col gap-1.5">
        {upcoming.map((r, i) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2"
            style={{ opacity: 1 - i * 0.25 }}
          >
            <span className="text-[10px] text-muted-foreground font-medium w-4 shrink-0">
              {i + 2}
            </span>
            <span className="text-xs text-muted-foreground truncate flex-1">
              {r.node.title}
            </span>
            <Badge variant="outline" className="text-[10px] shrink-0 border-border/40 py-0">
              {r.interval === 0 ? 'New' : `${r.interval}d`}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({
  completedCount,
  correctCount,
}: {
  completedCount: number
  correctCount: number
}) {
  const accuracy = completedCount > 0
    ? Math.round((correctCount / completedCount) * 100)
    : 0
  const dots = Array.from({ length: 10 })

  return (
    <div className="text-center animate-nexus-fade-in relative overflow-hidden pb-4">
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none">
        {dots.map((_, i) => <ConfettiDot key={i} index={i} />)}
      </div>

      <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 mx-auto animate-nexus-celebrate">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>

      <h3 className="text-xl font-semibold mb-2">🎉 Session Complete!</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        You reviewed{' '}
        <span className="font-semibold text-foreground">{completedCount}</span>{' '}
        {completedCount === 1 ? 'card' : 'cards'}. Great work keeping your knowledge fresh!
      </p>

      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border/50 bg-card/50 px-5 py-3">
          <span className="text-2xl font-bold text-emerald-500">{accuracy}%</span>
          <span className="text-[11px] text-muted-foreground">accuracy</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border/50 bg-card/50 px-5 py-3">
          <span className="text-2xl font-bold">{completedCount}</span>
          <span className="text-[11px] text-muted-foreground">cards done</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        <Badge
          variant="outline"
          className="gap-1 text-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
        >
          <CheckCircle2 className="h-3 w-3" /> All caught up
        </Badge>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ReviewCardsProps {
  reviews: ReviewWithNode[]
}

export default function ReviewCards({ reviews }: ReviewCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [completedCount, setCompletedCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Hydrate persisted preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GOAL_STORAGE_KEY)
      if (stored) {
        const parsed = parseInt(stored, 10)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!isNaN(parsed) && parsed > 0) setDailyGoal(parsed)
      }
    } catch { /* ignore */ }
    try {
      const storedSound = localStorage.getItem('nexus-review-sound')
      if (storedSound !== null) setSoundEnabled(storedSound !== 'false')
    } catch { /* ignore */ }
  }, [])

  const current = reviews[currentIndex]

  // ── Advance to next card ──────────────────────────────────────────────────

  const advanceCard = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setIsFlipped(false)
      setIsTransitioning(false)
      setCompletedCount((c) => c + 1)
      if (currentIndex < reviews.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsDone(true)
      }
    }, FLIP_MS)
  }, [currentIndex, reviews.length])

  // ── Rating ────────────────────────────────────────────────────────────────

  function handleRate(rating: number) {
    if (!current || isTransitioning) return
    if (soundEnabled) playRatingSound(rating)
    if (rating >= 2) setCorrectCount((c) => c + 1)

    startTransition(async () => {
      await submitReview(current.id, rating)
      advanceCard()
    })
  }

  // Play completion sound after isDone flips
  useEffect(() => {
    if (isDone && soundEnabled) playCompletionSound()
  }, [isDone, soundEnabled])

  // ── Skip ──────────────────────────────────────────────────────────────────

  function handleSkip() {
    if (isTransitioning || currentIndex >= reviews.length - 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setIsFlipped(false)
      setIsTransitioning(false)
      setCurrentIndex((i) => i + 1)
    }, FLIP_MS)
  }

  // ── Snooze ────────────────────────────────────────────────────────────────

  function handleSnooze(duration: '1h' | '1d') {
    if (!current || isTransitioning) return
    startTransition(async () => {
      await snoozeReview(current.id, duration)
      advanceCard()
    })
  }

  // ── Touch / swipe ─────────────────────────────────────────────────────────

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0 && !isFlipped) {
        setIsFlipped(true)
      } else if (dx < 0) {
        handleSkip()
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // ── Goal editing ──────────────────────────────────────────────────────────

  function saveGoal() {
    const val = parseInt(goalInput, 10)
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val)
      try { localStorage.setItem(GOAL_STORAGE_KEY, String(val)) } catch { /* ignore */ }
    }
    setEditingGoal(false)
  }

  // ── Completion screen ─────────────────────────────────────────────────────

  if (isDone) {
    return <CompletionScreen completedCount={completedCount} correctCount={correctCount} />
  }

  if (!current) return null

  // ── Derived values ────────────────────────────────────────────────────────

  const ratingButtons = [
    {
      rating: 0, label: 'Forgot', icon: <RotateCcw className="h-4 w-4" />,
      variant: 'destructive' as const, hint: '1d',
    },
    {
      rating: 1, label: 'Hard', icon: <Frown className="h-4 w-4" />,
      variant: 'outline' as const, hint: '1d',
    },
    {
      rating: 2, label: 'Good', icon: <Smile className="h-4 w-4" />,
      variant: 'outline' as const,
      hint: `${Math.max(1, Math.round(current.interval * current.ease_factor))}d`,
    },
    {
      rating: 3, label: 'Easy', icon: <Sparkles className="h-4 w-4" />,
      variant: 'default' as const,
      hint: `${Math.max(6, Math.round(current.interval * current.ease_factor * 1.3))}d`,
    },
  ]

  function getDomain(url: string) {
    try { return new URL(url).hostname.replace('www.', '') } catch { return url }
  }

  const progressPct = (currentIndex / reviews.length) * 100
  const goalPct = Math.min(100, (completedCount / dailyGoal) * 100)
  const upcoming = reviews.slice(currentIndex + 1, currentIndex + 3)
  const displayTags = (current.tags ?? []).slice(0, 3)

  return (
    <div className="w-full max-w-xl mx-auto animate-nexus-fade-in">

      {/* ── Top toolbar ── */}
      <div className="flex items-center justify-between mb-3">
        {/* Daily goal */}
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
          {editingGoal ? (
            <form
              onSubmit={(e) => { e.preventDefault(); saveGoal() }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                min={1}
                max={200}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onBlur={saveGoal}
                autoFocus
                className="w-14 h-6 text-xs rounded border border-border/60 bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </form>
          ) : (
            <button
              onClick={() => { setGoalInput(String(dailyGoal)); setEditingGoal(true) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Click to change daily goal"
            >
              Goal: {completedCount}/{dailyGoal}
            </button>
          )}
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {Math.round((correctCount / completedCount) * 100)}% accuracy
            </span>
          )}
          <button
            onClick={() => {
              const next = !soundEnabled
              setSoundEnabled(next)
              try { localStorage.setItem('nexus-review-sound', String(next)) } catch { /* ignore */ }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-[oklch(0.7_0.2_310)] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          {currentIndex + 1} / {reviews.length}
        </span>
      </div>

      {/* ── 3D flip card ── */}
      <div
        className="review-flip-perspective"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={cn(
            'review-flip-inner',
            isFlipped && 'is-flipped',
            isTransitioning && 'opacity-60 scale-95 transition-[opacity,transform] duration-300',
          )}
        >
          {/* Front */}
          <div className="review-flip-face">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg leading-snug flex-1">
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
                  {getDomain(current.node.url)}
                </a>
                {displayTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                    {displayTags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-primary/20 text-primary/80 bg-primary/5"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="min-h-[100px] flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 border border-border/30 p-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Can you recall the key points from this article?
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 text-center">
                    Swipe right or tap below to reveal
                  </p>
                  <Button
                    onClick={() => setIsFlipped(true)}
                    variant="outline"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    disabled={isPending}
                  >
                    <Eye className="h-4 w-4" />
                    Reveal Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Back */}
          <div className="review-flip-face review-flip-back w-full">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg leading-snug flex-1">
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
                  {getDomain(current.node.url)}
                </a>
                {displayTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                    {displayTags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-primary/20 text-primary/80 bg-primary/5"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/20 border border-border/30 p-4">
                  <p className="text-sm leading-relaxed">{current.node.summary}</p>
                </div>
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    How well did you recall this?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ratingButtons.map((btn) => (
                      <Button
                        key={btn.rating}
                        variant={btn.variant}
                        onClick={() => handleRate(btn.rating)}
                        disabled={isPending || isTransitioning}
                        className="flex flex-col h-auto py-3 gap-1 text-xs"
                      >
                        {btn.icon}
                        <span className="font-medium">{btn.label}</span>
                        <span className="text-[10px] opacity-60">{btn.hint}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Skip / Snooze ── */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          disabled={isPending || isTransitioning || currentIndex >= reviews.length - 1}
          onClick={handleSkip}
        >
          Skip <ChevronRight className="h-3 w-3" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1"
              disabled={isPending || isTransitioning}
            >
              <Clock className="h-3 w-3" /> Snooze
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[130px]">
            <DropdownMenuItem onClick={() => handleSnooze('1h')}>
              Defer 1 hour
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSnooze('1d')}>
              Defer 1 day
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Queue preview ── */}
      <QueuePreview upcoming={upcoming} />
    </div>
  )
}
