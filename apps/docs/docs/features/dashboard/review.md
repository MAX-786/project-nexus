---
sidebar_position: 3
---

# Review (Spaced Repetition)

The Review tab implements gamified spaced repetition to help you retain the knowledge you capture.

## Algorithm: SuperMemo-2 (SM-2)

Project Nexus uses the classic **SM-2** algorithm to schedule reviews. The algorithm tracks two variables per node:

| Variable | Default | Description |
|---|---|---|
| `interval` | 1 day | Days until the next review. |
| `ease_factor` | 2.5 | Multiplier applied to the interval on each successful review. |

After each review, the next interval is calculated based on your rating:

- **Forgot (0)**: interval resets to 1. ease_factor decreases.
- **Hard (3)**: small interval increase.
- **Good (4)**: interval × ease_factor.
- **Easy (5)**: interval × ease_factor × 1.3.

## Daily Review Queue

The Review tab loads all nodes where `next_review_date ≤ today`. They are presented one at a time as flashcards.

## Flashcard UI

Each flashcard shows:
1. The **node title** and source URL.
2. **Entity tags** extracted from the DB, displayed as badges on each card (up to 3).
3. A **"Reveal"** button to show the summary.
4. After reveal: **rating buttons** (Forgot, Hard, Good, Easy) and a **Snooze dropdown** (1h / 1d defer via server action).

### Enhancements & Gestures
- **3D Card Flip:** Smooth CSS 3D flip animations during rate and skip actions (with `prefers-reduced-motion` playback support).
- **Mobile Swipe Gestures:** Swipe right to reveal, swipe left to skip.
- **Audio Effects:** Web Audio API sound effects trigger on interactions (with a localStorage toggle to mute).
- **Queue Preview:** The UI shows the next 2 upcoming cards visually stacked beneath the current active card.
- **Celebration Screen:** Once the daily queue is complete, an enhanced celebration screen is displayed featuring CSS confetti and bounce animations.

## Review Streak & Goals

By maintaining a daily review habit, you unlock further visual enhancements:
- **Active Streak Flame:** An animated flame icon indicates an active review streak.
- **Daily Review Goal:** Set a numeric review goal (default 10, click-to-edit). Progress is tracked via a mini progress bar, persisting in localStorage.

## Stats & Tracker

The Review tab header displays:
- **Due today** — number of cards in the current queue.
- **Current streak** — consecutive days of reviewing.
- **Session Accuracy:** A live session accuracy percentage tracker shown during the session and on the final completion screen.

## Review Records

Each node has a corresponding entry in the `reviews` table:

```sql
reviews (
  id uuid,
  node_id uuid,       -- links to nodes table
  user_id uuid,       -- RLS enforced
  next_review_date date,
  interval integer,
  ease_factor numeric
)
```

Review records are created automatically when a node is captured and deleted when a node is deleted.
