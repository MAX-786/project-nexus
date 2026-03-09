---
sidebar_position: 2
---

# Local Supabase Setup

Running Supabase locally gives you a fully isolated, free development environment. All data stays on your machine.

## Prerequisites

- **Docker Desktop** installed and running.
- **Supabase CLI** installed:
  ```bash
  npm install -g supabase
  # or with Homebrew
  brew install supabase/tap/supabase
  ```

## Start the Local Instance

```bash
# From the project root
supabase start
```

When it finishes, it prints your local credentials:

```
API URL: http://127.0.0.1:54321
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
```

## Configure Environment Variables

**`apps/web/.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**`apps/extension/.env.local`**:
```env
PLASMO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PLASMO_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
```

## Apply the Schema

```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/` in order, initialising all tables, functions, and RLS policies.

## Local Supabase Studio

The Supabase Studio UI is available at **`http://127.0.0.1:54323`**. Use it to:
- Browse tables and data.
- Run SQL queries.
- Manage Auth users.
- Inspect RLS policies.

## Stop Supabase

```bash
supabase stop
```

This gracefully stops all Docker containers. Your data is preserved between restarts.

## Running Migrations

When new migration files are added to `supabase/migrations/`, apply them:

```bash
# Reset and re-apply all migrations (destroys local data)
supabase db reset

# Or apply only new migrations
supabase migration up
```

## Troubleshooting

### "column users.banned_until does not exist"

This is a known local Supabase CLI/image version mismatch. Patch it manually:

```bash
docker exec -e PGPASSWORD=postgres supabase_db_project_nexus psql \
  -U supabase_admin -d postgres -c \
  "ALTER TABLE auth.users 
    ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone;
   ALTER TABLE auth.users 
    ADD COLUMN IF NOT EXISTS is_sso_user boolean NOT NULL DEFAULT false;
   ALTER TABLE auth.users 
    ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
   ALTER TABLE auth.users 
    ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;"
```
