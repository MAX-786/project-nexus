---
sidebar_position: 3
---

# Architecture

A technical overview of how Project Nexus is structured.

## High-Level Diagram

```
┌──────────────────────────────────────────────────────┐
│                   Browser (Chrome)                    │
│                                                       │
│  ┌─────────────────────┐   ┌────────────────────────┐│
│  │  Plasmo Extension   │   │  Next.js Web Dashboard ││
│  │  - Popup (capture)  │   │  - Feed                ││
│  │  - Options (BYOK)   │   │  - Knowledge Graph     ││
│  │  - Background SW    │   │  - Review              ││
│  │  - Content Script   │   │  - Memory Agent        ││
│  └──────────┬──────────┘   └──────────┬─────────────┘│
└─────────────┼────────────────────────┼──────────────┘
              │                        │
              │ Direct API (BYOK)      │ Next.js Server
              ↓                        │ Actions
┌─────────────────────┐                │
│   LLM Provider      │                │
│ OpenAI/Anthropic/   │                │
│     Gemini          │                │
└─────────────────────┘                │
                                       ↓
                        ┌──────────────────────────────┐
                        │          Supabase             │
                        │  PostgreSQL + pgvector        │
                        │  Auth (JWT)                   │
                        │  Row Level Security           │
                        └──────────────────────────────┘
```

## Monorepo Layout

The project uses **pnpm workspaces** + **TurboRepo** for monorepo management.

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── dashboard/
│   │   │   ├── feed/     # Feed page + server actions
│   │   │   ├── graph/    # Graph page + server actions
│   │   │   ├── review/   # Review page + server actions
│   │   │   ├── memory/   # Memory page + server actions
│   │   │   └── settings/ # Settings page + server actions
│   │   ├── auth/         # Auth callbacks
│   │   ├── login/        # Login page
│   │   └── signup/       # Signup page
│   ├── components/
│   │   ├── dashboard/    # Feature-specific components
│   │   └── ui/           # Shadcn UI primitives
│   ├── lib/              # Utilities and Zustand stores
│   └── utils/
│       └── supabase/     # Supabase client helpers

apps/extension/
├── popup.tsx             # Extension popup UI
├── options.tsx           # Extension settings UI
├── background.ts         # Service worker / capture logic
└── content.tsx           # Content script (DOM extraction)

packages/shared/
└── src/
    └── types.ts          # Shared TypeScript database types
```

## State Management

All client-side state uses **Zustand**:

| Store | Purpose |
|---|---|
| `auth-store` | Authenticated user session. |
| `nodes-store` | Nodes, entities, edges; filtered search results; optimistic deletes. |
| `ui-store` | Shared UI state (e.g., currently selected node). |
| `memory-settings` | Memory Agent configuration (persisted to localStorage). |

Data is fetched in **Server Components** and passed down as props. Zustand stores are hydrated via Provider components on the client.

## Data Flow: Capture

1. User clicks "Capture" in the extension popup.
2. `popup.tsx` sends a Chrome message to `background.ts`.
3. `background.ts` sends a message to `content.tsx` to extract the page text.
4. `content.tsx` reads the `<article>` element or YouTube transcript and returns the raw text.
5. `background.ts` calls the LLM API directly (user's key from local storage) using the Vercel AI SDK.
6. The LLM returns `{ summary, entities }` as structured JSON.
7. `background.ts` calls Supabase to insert the node, entities, and trigger embedding generation.
8. The database function auto-creates edges based on vector similarity.
9. `popup.tsx` shows the success state.

## Data Flow: Dashboard

1. User navigates to `/dashboard`.
2. Next.js Server Component fetches nodes from Supabase (using the server-side Supabase client, which reads the session cookie).
3. Data is passed to client components (Feed, Graph, etc.) as props.
4. Mutations (delete, review rating, create edge) are handled by **Server Actions** which call Supabase and call `revalidatePath` to trigger re-fetching.

## Database Design

See [Database Schema Reference](../reference/database-schema.md) for the full schema.

Key design decisions:
- **pgvector** for semantic similarity search on node embeddings.
- **Row Level Security (RLS)** on every table: `auth.uid() = user_id`.
- **Cascade deletes** on entities and edges when a node is deleted (via FK constraints).
- **Hybrid search** function combining full-text search and vector similarity.
