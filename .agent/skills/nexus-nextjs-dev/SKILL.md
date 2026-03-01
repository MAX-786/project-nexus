---
name: nexus-nextjs-dev
description: Guidelines for writing Next.js App Router frontend code, using Shadcn UI, and TailwindCSS for Project Nexus. Use this when creating or modifying UI components, pages, or client/server interactions.
---

# Next.js & Frontend Guidelines

## Component Architecture (App Router)
1. **Default to Server Components:** All components in the `app/` directory must be Server Components by default.
2. **Client Components:** Only add `"use client"` at the top of a file if it absolutely requires React hooks (`useState`, `useEffect`), browser APIs (like `window`), or complex interactivity (like React Flow canvases).
3. **Data Fetching:** Fetch data directly in Server Components using async/await and the `@supabase/ssr` client. Do not use `useEffect` for data fetching unless paginating on the client.

## UI & Styling
1. **Shadcn UI:** Always check if a Shadcn component exists (e.g., Button, Dialog, Card, Sheet, Toast) before building a custom one. 
2. **TailwindCSS:** Use utility classes for all styling. Do not use inline styles or external CSS files.
3. **Responsive Design:** Build mobile-first. Use `md:` and `lg:` prefixes for desktop views. The web app must look perfect on both mobile devices and large desktop monitors.
4. **Icons:** Strictly use `lucide-react` for all icons.

## Loading & Error States
- Every asynchronous action must have a visual loading state (spinner or skeleton loader).
- Use Next.js `loading.tsx` and `error.tsx` boundaries for page-level states.