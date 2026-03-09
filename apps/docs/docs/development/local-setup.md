---
sidebar_position: 1
---

# Local Development Setup

This guide covers everything you need to develop Project Nexus locally.

## Monorepo Structure

```
project-nexus/
├── apps/
│   ├── web/          # Next.js dashboard (port 3000)
│   ├── extension/    # Plasmo browser extension
│   └── docs/         # Docusaurus documentation site (port 3001)
├── packages/
│   └── shared/       # Shared TypeScript types
├── supabase/
│   └── migrations/   # Database migration files
├── supabase_setup.sql # Full database bootstrap script
└── prd.md            # Product Requirements Document
```

## Prerequisites

- **Node.js** v20+
- **pnpm** v9+ (`corepack enable` to activate)
- **Docker Desktop** (for local Supabase)

## Install Dependencies

```bash
corepack enable
pnpm install
```

## Start Development Servers

### All Services (Recommended)

```bash
pnpm dev
```

TurboRepo runs all `dev` tasks in parallel:
- `apps/web` → Next.js dev server at `http://localhost:3000`
- `apps/extension` → Plasmo dev watcher (outputs to `apps/extension/build/`)
- `apps/docs` → Docusaurus dev server at `http://localhost:3001`

### Individual Services

```bash
# Web dashboard only
pnpm --filter web dev

# Extension only
pnpm --filter @nexus/extension dev

# Docs only
pnpm --filter @nexus/docs start
```

## TypeScript Type Checking

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Some type errors from uninstalled optional dependencies are pre-existing and unrelated to code correctness.

## Project-Specific Conventions

- **Server Components** are the default for all Next.js pages. Use `"use client"` only when interactivity, hooks, or browser APIs are required.
- **Server Actions** are used for all database mutations (located in `app/dashboard/*/actions.ts`).
- **Zustand stores** manage all client-side global state (`apps/web/src/lib/`).
- **Supabase RLS** is enforced on all tables. All queries must satisfy `auth.uid() = user_id`.
- **Shared types** for database models live in `packages/shared/src/types.ts`.

## Useful Commands

```bash
# Check git log
git log --oneline

# Run TypeScript check
cd apps/web && pnpm exec tsc --noEmit

# Build all packages
pnpm build

# Lint all packages
pnpm lint
```
