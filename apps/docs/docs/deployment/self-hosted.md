---
sidebar_position: 3
---

# Self-Hosted Deployment

Run the entire Project Nexus stack on your own infrastructure.

## Stack

For a fully self-hosted deployment you need to host:

| Service | Recommended Option |
|---|---|
| **Next.js Web App** | Vercel, Railway, Render, Docker |
| **Supabase (DB + Auth)** | Self-hosted Supabase (Docker) |

## Option A: Docker + Local Supabase

Suitable for home servers, VPS instances, or air-gapped environments.

### Prerequisites
- A VPS or server with Docker and Docker Compose.
- A domain name (optional but recommended for auth redirects).

### Steps

1. **Set up local Supabase** — See [Local Supabase Setup](../development/local-supabase.md). Run the same steps on your server.

2. **Clone the repository** on your server:
   ```bash
   git clone https://github.com/MAX-786/project-nexus.git
   cd project-nexus
   ```

3. **Configure `.env.local`** with your self-hosted Supabase URLs.

4. **Build the Next.js app**:
   ```bash
   pnpm install
   pnpm build
   ```

5. **Start the production server**:
   ```bash
   cd apps/web
   pnpm start
   ```

   Or add it as a `systemd` service or run it behind an Nginx reverse proxy.

## Option B: Railway / Render

Both Railway and Render support Next.js monorepos with minimal configuration:

1. Connect your GitHub repository.
2. Set the **root directory** to `apps/web` and the **build command** to `cd ../.. && pnpm install && pnpm --filter web build`.
3. Add the required environment variables.
4. Deploy.

## Environment Variables for Production

See the full [Environment Variables Reference](../reference/environment-variables.md). Key variables for production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-instance.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```
