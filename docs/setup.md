# Project Nexus Setup Guide

This guide provides a deep dive into configuring Project Nexus for local development, emphasizing privacy through the Bring Your Own Key (BYOK) model, configuring Supabase, and preparing for deployment.

## 1. Project Architecture Overview

Project Nexus is a monorepo managed with **pnpm workspaces** and **TurboRepo**.
- **`apps/web`**: The Next.js dashboard application. Provides features to view, manage, and visualize captured knowledge on a 2D canvas (React Flow).
- **`apps/extension`**: The Plasmo-based browser extension. Captures data (webpages, transcripts) directly from the user's active tab.

To run the entire system locally:
```bash
# From the project root
pnpm install
pnpm dev
```
This single command spins up both the Next.js development server and the Plasmo extension development watcher concurrently.

## 2. Bring Your Own Key (BYOK) Configuration

To ensure absolute privacy, the free tier of Project Nexus operates strictly under a BYOK model. 

### How BYOK Works in Project Nexus:
1. **No Backend Routing:** AI processing (summarization, embedding generation) must happen locally inside the user's browser via the extension's background service worker or a secure client-side mechanism. API calls are NOT sent to our Next.js backend.
2. **Local Storage:** The user provides their API key (e.g., OpenAI, Anthropic, Gemini) via the extension's options page. This key is stored securely in the browser's local storage (`chrome.storage.local` or Plasmo Storage).
3. **Direct API Calls:** The Vercel AI SDK is used inside the extension to make necessary LLM requests directly to the provider.

### Managing BYOK Keys Locally:
While developing, you do not need to hardcode API keys in the `.env` file unless you are explicitly building a feature for the *Server-Side Managed Hosting* tier. 
For standard local development, you should:
1. Load the extension in your browser.
2. Open the Extension Options page.
3. Paste your preferred API key (e.g., Gemini) in the UI. 
The extension handles securing and utilizing this key.

## 3. Supabase Configuration

Supabase handles our database (PostgreSQL), authentication, and vector embeddings (`pgvector`).

### Option A: Supabase Cloud (Recommended for quick start)
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings -> API** and copy your `Project URL` and `anon` public key.
3. Paste these into your root `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   PLASMO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PLASMO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Navigate to the SQL Editor in the Supabase Dashboard.
5. Copy the contents of `/supabase_setup.sql` from the root of this repository.
6. Run the script to initialize the tables, RLS policies, and enable `pgvector`.

### Option B: Local Supabase Development
*Ensure Docker is installed and running.*
1. Install the Supabase CLI: `npm install -g supabase` or via `brew install supabase/tap/supabase`.
2. Initialize and start Supabase at the project root:
   ```bash
   supabase init
   supabase start
   ```
3. The CLI will output local API URLs and anon keys. Copy these into your `.env.local`.
4. Run the setup SQL script against your local database instance:
   ```bash
   supabase db reset
   ```
*(Note: If the `supabase_setup.sql` logic is not yet integrated into `supabase/migrations/`, you may need to apply it manually via the local Studio UI at `http://127.0.0.1:54323`).*

## 4. Vercel Deployment

The Next.js dashboard (`apps/web`) is optimized for Vercel.

1. Create a project on Vercel and import your GitHub repository.
2. During the import configuration, **Vercel should automatically detect the Root Directory (`./`) and Framework (Next.js)** because of the turbo configuration.
3. In the "Environment Variables" section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (Set to your Vercel production domain)
4. Click Deploy. Vercel will build the Next.js app via turbo (`turbo run build`).

### Extension Deployment (Chrome Web Store)
To package the extension for the Chrome Web Store:
```bash
# In apps/extension
pnpm run build
```
This generates a production-ready `.zip` file in `apps/extension/build/chrome-mv3-prod` suitable for upload to the Chrome Developer Dashboard.
