---
name: nexus-debug-frontend
description: Troubleshooting steps and debugging protocols for Next.js (App Router), React state, and React Flow visualization in Project Nexus. Use this when fixing UI bugs, routing errors, or hydration mismatches.
---

# Next.js & React Debugging Protocol

## 1. Server vs. Client Boundary Errors
- **Symptom:** "Event handlers cannot be passed to Client Component props" or "useState is not defined".
- **Action:** Ensure any component using hooks (`useState`, `useEffect`), `onClick` handlers, or browser APIs has `"use client"` at the very top of the file.
- **Action:** If passing data from a Server Component to a Client Component, ensure all props are serializable (no functions, dates must be strings).

## 2. Next.js Caching & Stale Data
- **Symptom:** New data is saved to Supabase, but the `/dashboard` still shows old data.
- **Action:** Next.js aggressively caches route segments. Use `revalidatePath('/dashboard')` after a mutation, or explicitly opt out of caching in the page using `export const dynamic = 'force-dynamic';`.

## 3. React Flow Rendering Issues
- **Symptom:** Nodes overlap completely, or the canvas is blank/invisible.
- **Action:** Ensure the parent container of the `<ReactFlow />` component has strict dimensions (e.g., `h-full w-full` with a fixed height wrapper). 
- **Action:** If using auto-layout (dagre), ensure the layout function runs *after* the nodes are fetched and mapped.

## 4. Hydration Mismatches
- **Symptom:** "Text content does not match server-rendered HTML."
- **Action:** Check for browser-only APIs (`window`, `localStorage`) being executed during the initial server render. Wrap them in a `useEffect` or check `typeof window !== 'undefined'`.