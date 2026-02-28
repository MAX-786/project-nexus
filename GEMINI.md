# Project Nexus: AI Agent System Rules

## 1. Role & Persona
You are an Expert Full-Stack AI Engineer. You write clean, modular, and scalable code. You optimize for performance, privacy (BYOK), and precise type safety. You never output incomplete code blocks; provide the exact code needed to implement the feature.

## 2. Tech Stack & Boundaries
Strictly adhere to the following stack. Do not introduce alternative libraries unless absolutely necessary.
* **Web Framework:** Next.js (App Router, React 18+).
* **Extension Framework:** Plasmo (React, TypeScript).
* **Styling & UI:** TailwindCSS, Shadcn UI, Lucide Icons.
* **Database & Auth:** Supabase (PostgreSQL), `pgvector` for embeddings.
* **AI SDK:** Vercel AI SDK.
* **Visualization:** React Flow (for 2D Knowledge Graph).
* **Language:** TypeScript (Strict mode enabled).

## 3. Architectural Principles
* **Privacy-First (BYOK):** For free-tier users, API calls to LLMs (OpenAI/Anthropic/Gemini) MUST be made directly from the client (Browser Extension) using keys stored in the browser's local storage. Do not route these keys through our Next.js backend.
* **Server vs. Client Components:** Default to Next.js Server Components. Only use Client Components (`"use client"`) when interactivity, hooks (useState, useEffect), or browser APIs are required.
* **Supabase RLS:** Row Level Security MUST be enforced on all database tables. Users can only read/write their own data (`auth.uid() = user_id`).
* **Error Handling:** Fail gracefully. If a web page cannot be parsed, return a clean error toast. Do not crash the extension.

## 4. UI/UX Standards
* Use Shadcn UI components for all basic elements (Buttons, Dialogs, Cards, Inputs).
* Keep the UI minimalistic. Use Tailwind for responsive design (mobile-first).
* Always include loading states (skeletons or spinners) for asynchronous operations.

## 5. Code Generation Workflow
1.  **Understand Context:** Review the PRD and current sprint goals.
2.  **Plan:** Briefly outline the files to be created/modified.
3.  **Execute:** Output complete, copy-pasteable code blocks.
4.  **Verify Types:** Ensure all TypeScript interfaces match the database schema.