---
sidebar_position: 1
---

# Deploy to Vercel

The Next.js web dashboard (`apps/web`) is optimised for deployment on [Vercel](https://vercel.com/).

## Prerequisites

- A [Vercel account](https://vercel.com/signup).
- A [Supabase Cloud project](https://supabase.com/) with the schema initialised.
- Your production domain (optional but recommended).

## Steps

### 1. Import the Repository

1. Log into Vercel and click **"Add New Project"**.
2. Import your fork of `MAX-786/project-nexus` from GitHub.
3. Vercel will auto-detect the TurboRepo monorepo structure.

### 2. Configure Build Settings

Vercel should auto-configure these, but verify:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` (leave as root) |
| **Build Command** | `turbo run build --filter=web` |
| **Output Directory** | `apps/web/.next` |

### 3. Set Environment Variables

In the Vercel project settings, add these environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key. |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel production domain (e.g., `https://nexus.yourdomain.com`). |

### 4. Deploy

Click **"Deploy"**. Vercel runs the TurboRepo build and deploys the Next.js app.

## Continuous Deployment

Vercel automatically triggers a new deployment on every push to your main branch. Preview deployments are created for pull requests.

## Post-Deployment: Update Supabase Auth Settings

After deploying, update your Supabase project's auth settings:
1. Go to **Supabase Dashboard → Auth → URL Configuration**.
2. Set **Site URL** to your Vercel production domain.
3. Add your Vercel domain to the **Redirect URLs** list.

This ensures auth redirects work correctly in production.

## Extension Deployment (Chrome Web Store)

To publish the extension:

```bash
cd apps/extension
pnpm build
```

This generates a production build in `apps/extension/build/chrome-mv3-prod/`. Upload the folder (or zip it first) to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
