---
name: nexus-deployments
description: Deployment protocols for Vercel (Next.js Web App), Chrome Web Store packaging (Plasmo Extension), and Supabase production migrations. Use this when setting up CI/CD, preparing a release, or configuring deployment environment variables.
---

# Project Nexus: Deployment & DevOps Protocol

## 1. Vercel Deployment (Next.js Web App)
- **Monorepo Handling:** If the project is structured as a monorepo (e.g., Turborepo or npm workspaces), ensure the Vercel Root Directory is set to `apps/web` (or the folder containing the Next.js app).
- **Build Command:** The build command must strictly be `npm run build` (or `pnpm build`).
- **Environment Variables:** Never commit `.env` files. When setting up deployments, explicitly list the required Vercel environment variables (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Edge Functions:** For long-running AI summarization tasks, ensure the Next.js API routes specify `export const maxDuration = 60;` to prevent Vercel's default 10-second timeout on the hobby tier.

## 2. Plasmo Extension Deployment
- **Production Build:** To build the extension for production, run `plasmo build --target=chrome-mv3`. 
- **Zip Packaging:** For Chrome Web Store submission, use `plasmo package`. This generates the `.zip` file.
- **Manifest Validation:** Before building, ensure the `package.json` contains the correct version number, description, and permissions (e.g., `storage`, `activeTab`, `scripting`) required by the Chrome Web Store.

## 3. Supabase Production Migrations
- **Database Changes:** Never make database schema changes directly in the Supabase production dashboard.
- **Migration Generation:** Always use the Supabase CLI: `supabase db diff -f feature_name` to generate a migration file.
- **Type Generation:** After a database change, run `supabase gen types typescript --local > types/supabase.ts` to keep the frontend types perfectly synced with the backend schema.