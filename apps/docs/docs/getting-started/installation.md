---
sidebar_position: 1
---

# Installation

This guide walks you through setting up Project Nexus from scratch for local development.

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | v20+ | Required by all packages |
| [pnpm](https://pnpm.io/) | v9+ | Monorepo package manager |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Required for local Supabase (optional) |
| [Supabase account](https://supabase.com/) | — | Cloud or self-hosted |
| Chrome / Chromium browser | — | For loading the extension |

## Step 1: Clone the Repository

```bash
git clone https://github.com/MAX-786/project-nexus.git
cd project-nexus
```

## Step 2: Install Dependencies

```bash
corepack enable
pnpm install
```

This installs dependencies for all workspace packages: `apps/web`, `apps/extension`, and `apps/docs`.

## Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PLASMO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

See the full [Environment Variables Reference](../reference/environment-variables.md) for all available options.

## Step 4: Initialize the Database

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to your project.
2. Go to **SQL Editor**.
3. Copy the contents of `supabase_setup.sql` from the project root.
4. Run the script. This creates all tables, enables `pgvector`, and sets up RLS policies.

:::tip Local Supabase
For a fully offline setup, you can run Supabase locally with Docker. See [Local Supabase Setup](../development/local-supabase.md).
:::

## Step 5: Start the Development Server

```bash
pnpm dev
```

This starts both the Next.js web app (on `http://localhost:3000`) and the Plasmo extension watcher in parallel using TurboRepo.

## Step 6: Load the Extension

After `pnpm dev` is running:

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the directory: `apps/extension/build/chrome-mv3-dev`.

The Nexus icon will appear in your Chrome toolbar.

## Next Steps

- [Configure your BYOK API keys](./byok-setup.md)
- [Capture your first article](./first-capture.md)
