---
sidebar_position: 2
---

# Supabase Cloud Setup

For production deployments, Supabase Cloud is the recommended database provider.

## Create a Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **"New project"**.
3. Choose an organisation, project name, database password, and region.
4. Wait for the project to initialise (approximately 1 minute).

## Initialise the Schema

1. In the Supabase Dashboard, go to **SQL Editor**.
2. Click **"New query"**.
3. Copy the contents of `supabase_setup.sql` from the project root.
4. Paste and run the query.

This creates all tables, enables the `pgvector` extension, installs the hybrid search function, and sets up Row Level Security policies.

## Get Your Credentials

1. Go to **Project Settings → API**.
2. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL` and `PLASMO_PUBLIC_SUPABASE_URL`
   - **anon public key** → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `PLASMO_PUBLIC_SUPABASE_ANON_KEY`

## Enable Email Auth (Optional)

For development, you may want to disable email confirmation:
1. Go to **Auth → Providers → Email**.
2. Toggle **"Confirm email"** off.

For production, keep email confirmation enabled.

## Database Migrations

The project uses Supabase migrations in `supabase/migrations/`. To apply all migrations to your cloud project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

Or apply them manually via the SQL Editor in the dashboard.
