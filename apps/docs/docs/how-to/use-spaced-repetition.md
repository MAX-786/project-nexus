---
sidebar_position: 3
---

# How to Use Spaced Repetition

The Review tab implements the **SuperMemo-2 (SM-2)** spaced repetition algorithm to schedule when you should re-read each captured node. The more confidently you remember something, the longer the interval before it appears again.

## Starting a Review Session

1. Navigate to the **Review** tab in the dashboard.
2. If you have nodes due today, a review card appears.
3. If there are no nodes due, the tab shows an empty state with your current streak.

## The Flashcard Flow

Each review session works as a flashcard:

1. **The card shows**: The node's title and source URL.
2. **Click "Reveal"**: The AI-generated summary is revealed.
3. **Rate your recall**: Choose one of four ratings:

| Rating | Meaning | Effect on Interval |
|---|---|---|
| **Forgot** | I had no memory of this. | Resets interval to 1 day. |
| **Hard** | I remembered but it was difficult. | Short interval increase. |
| **Good** | I remembered with some effort. | Moderate interval increase. |
| **Easy** | I remembered effortlessly. | Large interval increase. |

## SM-2 Algorithm Details

The interval and ease factor are updated after each rating according to the SM-2 formula:

- **Ease Factor** starts at 2.5 and adjusts based on your ratings.
- **Interval** grows exponentially for "Good" and "Easy" ratings.
- **Forgot** resets the interval to 1 day and lowers the ease factor.

The `next_review_date` for each node is stored in the `reviews` table and queried daily.

## Review Streak

The dashboard shows your current review streak — the number of consecutive days you have completed at least one review. Maintaining a streak helps build a consistent habit.

## Tips

- **Capture frequently**: The more nodes you have, the more valuable the review system becomes.
- **Be honest with your ratings**: Over-rating yourself defeats the purpose of spaced repetition.
- **Review daily**: Even 5 minutes per day is enough to make steady progress.

## How Reviews Are Created

When you capture a new node, a `reviews` entry is automatically created with:
- `interval = 1` (day)
- `ease_factor = 2.5`
- `next_review_date = today`

The node will appear in your review queue on the same day it is captured.
