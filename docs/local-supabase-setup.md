# Local Supabase Environment Setup

Running Project Nexus on a local Supabase instance is the recommended setup for open-source development and debugging, as it ensures complete isolation and privacy.

## Prerequisites
- **Docker Desktop** must be installed and running on your machine.

## Initialization Steps

1. **Install the Supabase CLI**
   If you haven't already, install the CLI globally:
   ```bash
   npm install -g supabase
   ```
   *Alternatively, via Homebrew: `brew install supabase/tap/supabase`*

2. **Start the Local Instance**
   From the root of the Project Nexus repository, run:
   ```bash
   supabase init # (Only needed once, creates the supabase folder)
   supabase start
   ```

3. **Configure Environment Variables**
   Once the `supabase start` command finishes, it will print out your local `API URL` and `anon key`.
   Copy these values and update your `.env.local` files!

   **For Next.js App (`apps/web/.env.local`)**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   **For Extension (`apps/extension/.env.local`)**:
   ```env
   PLASMO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_here
   ```

## Managing the Database

- **Local Studio**: You can view and manage your local database using the Supabase Studio UI at `http://127.0.0.1:54323`.
- **Applying Schema**: If you need to manually apply the schema initially, copy the contents of `/supabase_setup.sql` and run it in the SQL Editor within the Local Studio.
- **Stopping Supabase**: When you're done working, run `supabase stop` to spin down the Docker containers and free up system resources.

## Troubleshooting

### "column users.banned_until does not exist" in Local Studio Auth Tab
This is a known issue caused by version mismatches between the local Supabase CLI and the downloaded Postgres image schemas. If you encounter this error in the Authentication tab, run the following Docker command to manually patch the missing columns:

```bash
docker exec -e PGPASSWORD=postgres supabase_db_project_nexus psql -U supabase_admin -d postgres -c "ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_sso_user boolean NOT NULL DEFAULT false; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;"
```
