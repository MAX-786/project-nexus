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
2. A **"Reveal"** button to show the summary.
3. After reveal: **rating buttons** (Forgot, Hard, Good, Easy).

## Review Streak

The streak counter shows how many consecutive days you have completed at least one review. Maintaining a streak helps build a consistent daily review habit.

## Stats

The Review tab header displays:
- **Due today** — number of cards in the current queue.
- **Current streak** — consecutive days of reviewing.

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
