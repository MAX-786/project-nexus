---
name: nexus-project-rules
description: Core architectural rules, tech stack, and privacy constraints for Project Nexus. Use this skill whenever starting a new task, making architectural decisions, generating project structures, or reviewing code.
---

# Project Nexus: Core Architecture & Rules

## Tech Stack
- **Web App:** Next.js (App Router), React 18+, TypeScript.
- **UI:** TailwindCSS, Shadcn UI, Lucide Icons.
- **Extension:** Plasmo framework (React, TypeScript).
- **Database:** Supabase (PostgreSQL), `pgvector`.
- **Visualization:** React Flow.

## Privacy & BYOK (Bring Your Own Key) Strict Rules
Project Nexus is an open-source, privacy-first tool. 
1. **Never** route user LLM API keys through our backend/Next.js server for Free Tier users.
2. API calls to OpenAI/Anthropic/Gemini MUST happen directly from the client (Browser Extension or Browser DOM) using the Vercel AI SDK.
3. API keys must be stored strictly in the browser's local storage or Plasmo's Secure Storage API.

## File Structure Conventions
- `apps/web/` - The Next.js web application.
- `apps/extension/` - The Plasmo browser extension.
- `packages/shared/` - Shared TypeScript types matching the Supabase schema.

## Coding Standards
- Use strict TypeScript. No `any` types.
- Fail gracefully. If an API call fails or a webpage DOM cannot be scraped, return a user-friendly error toast, do not crash the application.