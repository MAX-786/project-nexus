'use client'

import { Flame, Trophy, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewStreakProps {
  streak: number
  totalReviewed: number
  weeklyActivity: { date: string; count: number }[]
}

export default function ReviewStreak({
  streak,
  totalReviewed,
  weeklyActivity,
}: ReviewStreakProps) {
  const maxCount = weeklyActivity.length > 0
    ? Math.max(1, ...weeklyActivity.map((d) => d.count))
    : 1

  function getMotivationalMessage(s: number): string {
    if (s === 0) return 'Start your streak today!'
    if (s < 7) return `${s} day streak — keep going!`
    if (s < 30) return `${s} day streak — great consistency! 🔥`
    return `${s} day streak — you're on fire! 🚀`
  }

  function formatDay(dateStr: string): string {
    const d = new Date(dateStr)
    return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mt-3">
      {/* Streak */}
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2.5">
        <Flame
          className={cn(
            'h-5 w-5',
            streak > 0 ? 'text-orange-400' : 'text-muted-foreground',
          )}
        />
        <div>
          <p className="text-lg font-bold leading-none">{streak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2.5">
        <Trophy className="h-5 w-5 text-amber-400" />
        <div>
          <p className="text-lg font-bold leading-none">{totalReviewed}</p>
          <p className="text-xs text-muted-foreground">total reviewed</p>
        </div>
      </div>

      {/* Weekly heatmap */}
      <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2.5">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mb-0.5" />
        <div className="flex items-end gap-1">
          {weeklyActivity.map((day) => {
            const intensity =
              day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4)
            const colors = [
              'bg-muted/50',
              'bg-primary/20',
              'bg-primary/40',
              'bg-primary/70',
              'bg-primary',
            ]
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  title={`${day.date}: ${day.count} reviews`}
                  className={cn(
                    'h-7 w-7 rounded-md transition-colors',
                    colors[intensity],
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {formatDay(day.date)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Motivational message */}
      <p className="text-sm text-muted-foreground italic">
        {getMotivationalMessage(streak)}
      </p>
    </div>
  )
}
