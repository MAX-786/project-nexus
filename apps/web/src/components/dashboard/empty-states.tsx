'use client'

import {
  Rss,
  Network,
  GraduationCap,
  CheckCircle2,
  Puzzle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

// ─── Feed Empty State ────────────────────────────────────────────────────────

export function FeedEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-nexus-fade-in">
      {/* Icon with gradient background + glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[oklch(0.637_0.237_275/30%)] to-[oklch(0.7_0.2_310/30%)] blur-xl scale-150" />
        <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] flex items-center justify-center shadow-lg shadow-[oklch(0.637_0.237_275/25%)] animate-nexus-glow">
          <Rss className="h-9 w-9 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        No captures yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        Install the Nexus browser extension to start capturing web pages.
        They&apos;ll appear here with AI-generated summaries, entities, and connections.
      </p>

      {/* Decorative dots — simulated feed cards */}
      <div className="flex gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-28 rounded-xl border border-border/30 bg-muted/20 backdrop-blur-sm"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] text-white shadow-lg shadow-[oklch(0.637_0.237_275/20%)] hover:shadow-[oklch(0.637_0.237_275/40%)] transition-shadow border-0"
        >
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noreferrer"
          >
            <Puzzle className="h-4 w-4" />
            Install the Extension
          </a>
        </Button>
      </div>
    </div>
  )
}

// ─── Graph Empty State ───────────────────────────────────────────────────────

export function GraphEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center p-8 animate-nexus-fade-in">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[oklch(0.637_0.237_275/30%)] to-[oklch(0.7_0.2_310/30%)] blur-xl scale-150" />
        <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] flex items-center justify-center shadow-lg shadow-[oklch(0.637_0.237_275/25%)] animate-nexus-glow">
          <Network className="h-9 w-9 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        Your knowledge graph is empty
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        Capture your first page to see your ideas connect. The graph grows
        automatically as the AI finds relationships between your captures.
      </p>

      {/* Decorative mini-graph illustration */}
      <div className="relative w-64 h-32 mb-8">
        {/* Nodes */}
        <div className="absolute top-2 left-8 h-10 w-10 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/50" />
        </div>
        <div className="absolute top-0 right-12 h-10 w-10 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/30" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-10 w-10 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/30" />
        </div>
        <div className="absolute bottom-4 left-16 h-10 w-10 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="absolute bottom-6 right-8 h-10 w-10 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Connecting lines (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 256 128"
        >
          <line
            x1="52" y1="22" x2="180" y2="18"
            stroke="oklch(0.637 0.237 275 / 20%)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="52" y1="22" x2="128" y2="108"
            stroke="oklch(0.637 0.237 275 / 15%)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="180" y1="18" x2="128" y2="108"
            stroke="oklch(0.637 0.237 275 / 15%)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      <Button
        asChild
        variant="outline"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Link href="/dashboard/feed">
          <Sparkles className="h-4 w-4" />
          Capture your first page
        </Link>
      </Button>
    </div>
  )
}

// ─── Review Empty State ──────────────────────────────────────────────────────

interface ReviewEmptyStateProps {
  hasAnyReviews: boolean
}

export function ReviewEmptyState({ hasAnyReviews }: ReviewEmptyStateProps) {
  if (hasAnyReviews) {
    // User has reviews but none are due today — celebration variant
    return (
      <div className="text-center animate-nexus-fade-in">
        <div className="relative mb-6 mx-auto w-fit">
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl scale-150" />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="h-9 w-9 text-white" />
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">No cards due today</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          You&apos;re all caught up! 🎉 Come back tomorrow for your next review
          session. Consistency is the key to retention.
        </p>
      </div>
    )
  }

  // User has NO reviews at all — onboarding variant
  return (
    <div className="text-center animate-nexus-fade-in">
      <div className="relative mb-6 mx-auto w-fit">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[oklch(0.637_0.237_275/30%)] to-[oklch(0.7_0.2_310/30%)] blur-xl scale-150" />
        <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] flex items-center justify-center shadow-lg shadow-[oklch(0.637_0.237_275/25%)] animate-nexus-glow">
          <GraduationCap className="h-9 w-9 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        Build your review queue
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
        Start capturing web pages to build your spaced-repetition review queue.
        The AI generates flashcards so you never forget what you read.
      </p>

      <Button
        asChild
        variant="outline"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Link href="/dashboard/feed">
          <Sparkles className="h-4 w-4" />
          Start capturing
        </Link>
      </Button>
    </div>
  )
}
