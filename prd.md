
# Product Requirements Document (PRD): Project Nexus

**Status:** Approved for Development (Single Source of Truth)
**Version:** 1.0
**Product Type:** Open-Source Browser Extension & Next.js Web Application
**Core Value:** AI-powered knowledge capture, automatic graph linking, and spaced repetition.

---

## 1. Product Vision & Strategy

**The Pitch:** "Your Second Brain. Not Big Tech's." Nexus is an open-source, BYOK (Bring Your Own Key) knowledge tracker that auto-summarizes web content, builds a visual knowledge graph, and tests your memory—all while giving you 100% control over your data.

### Monetization Model (Open Core)

* **Tier 1: Hacker (Free):** Open-source code, BYOK (OpenAI/Anthropic/Gemini), local storage or self-hosted Supabase.
* **Tier 2: Nexus Cloud ($5-$8/mo):** BYOK, but we provide managed database hosting (Supabase), cross-device syncing, and automatic backups.
* **Tier 3: Nexus Pro ($15/mo):** Frictionless. No BYOK required (we route through our API keys), managed hosting, priority features.

---

## 2. Technical Stack (AI-Agent Optimized)

To ensure the AI coding agent builds this reliably and fast, we are strictly using this modern, highly-documented stack:

* **Browser Extension:** Plasmo Framework (React/TypeScript).
* **Web App & API:** Next.js (App Router), React, TypeScript.
* **UI Components:** TailwindCSS + Shadcn UI (Crucial: The AI knows Shadcn perfectly).
* **Database & Auth:** Supabase (PostgreSQL).
* **Vector Search & Graph:** `pgvector` (Supabase extension) for semantic similarity, **React Flow** for the 2D visual graph rendering.
* **LLM Integration:** Vercel AI SDK (standardizes calls to OpenAI/Anthropic/Google).

---

## 3. Database Schema Architecture

*Feed this conceptual schema to the AI agent before it writes backend code.*

| Table Name | Description | Key Columns |
| --- | --- | --- |
| `users` | Standard Supabase Auth | `id`, `email`, `tier` (free/cloud/pro), `encrypted_api_key` |
| `nodes` (Content) | The captured articles/videos | `id`, `user_id`, `url`, `title`, `summary`, `raw_text`, `embedding` (vector) |
| `entities` (Tags) | AI-extracted concepts/people | `id`, `user_id`, `name`, `type` (person, concept, tool) |
| `edges` (Relations) | Links between nodes/entities | `id`, `source_id`, `target_id`, `relationship_type`, `ai_confidence_score` |
| `reviews` | Spaced repetition tracking | `id`, `node_id`, `user_id`, `next_review_date`, `interval`, `ease_factor` |
| `collections` | Custom user-defined groups | `id`, `user_id`, `name`, `description` |
| `collection_nodes` | Mapping of nodes to collections | `collection_id`, `node_id` |
| `consolidations` | AI-generated overarching themes | `id`, `user_id`, `theme`, `summary`, `source_node_ids` |

---

## 4. Core Features & User Stories

### Epic 1: Extension Capture & BYOK Settings

**Context:** The Plasmo extension is the primary ingestion point.

* **Story 1.1 (Settings):** As a user, I can click the extension icon to open a Shadcn UI popover, where I can securely input and save my LLM API key (stored in local browser storage for Tier 1, or synced via Supabase for Tier 2).
* **Story 1.2 (Capture):** As a user, I can click a "Capture" button on any webpage. The extension scrapes the main `article` text or YouTube transcript.
* **Story 1.3 (AI Processing):** As a system, when text is captured, I use the provided API key to trigger an LLM prompt that returns a structured JSON containing: `{ "summary": "...", "entities": ["..."] }`.
* **Story 1.4 (Capture Counter):** As a user, I can see a daily capture count badge in the extension popup header that shows how many pages I've captured today.

### Epic 2: The Web Dashboard & Knowledge Graph

**Context:** The Next.js app where users view and interact with their data.

* **Story 2.1 (The Feed):** As a user, I want a split-screen dashboard. The left panel shows a chronological list of my captured nodes (Title + Summary preview).
* **Story 2.2 (Vector Auto-linking):** As a system, when a new node is saved, I generate a text embedding using `pgvector`. I query the database for similar existing nodes (cosine similarity > 0.8) and automatically create an `edge` between them.
* **Story 2.3 (Visual Graph):** As a user, I can view the right panel to see a React Flow 2D canvas mapping out my nodes and entities. Clicking a node opens a slide-out drawer with the full summary and its connections.
* **Story 2.4 (Search):** As a user, I can search across my captured nodes by title, summary, or entity name to quickly find relevant knowledge.
* **Story 2.5 (Delete):** As a user, I can delete a captured node, which also removes its entities, edges, and spaced repetition review entry.
* **Story 2.6 (Auth Callback):** As a system, when a user confirms their email after signup, I exchange the confirmation code for a session and redirect to the dashboard. *(Optional for MVP — email confirmation can be disabled in Supabase dashboard.)*
* **Story 2.7 (Collections & Bulk Ops):** As a user, I can create custom collections and perform bulk operations (like adding multiple nodes to a collection or bulk deleting nodes) from the feed.
* **Story 2.8 (Virtualized Feed):** As a system, I must render the feed list using virtualization to ensure smooth scrolling and performance even when the user has thousands of captured nodes.

### Epic 3: Gamified Spaced Repetition (The "Review" Tab)

**Context:** Ensuring users actually remember what they save.

* **Story 3.1 (Daily Queue):** As a user, I can navigate to the "Review" tab and see a queue of nodes due for review today.
* **Story 3.2 (Flashcard UI):** As a user, I am presented with a node's Title and a masked summary. I click "Reveal" to read the summary.
* **Story 3.3 (SuperMemo-2 Logic):** As a user, I rate my memory of the node (Forgot, Hard, Good, Easy). The system updates the `reviews` table calculating the `next_review_date` based on standard SM-2 algorithms.

### Epic 4: The Memory Agent & Consolidation

**Context:** "Always-On" intelligence that connects disparate dots.

* **Story 4.1 (Memory Settings):** As a user, I can configure a dedicated AI provider and API key specifically for the Memory Agent (falling back to my default key if needed), and choose between "Auto" or "Manual" operation mode.
* **Story 4.2 (Knowledge Consolidation):** As a system, when run, I periodically retrieve recent or related un-consolidated nodes and prompt the AI to find overarching themes and cross-cutting insights, saving these as `consolidations`.
* **Story 4.3 (Memory Chat):** As a user, I can switch to the "Memory" tab to see my latest consolidations and interact with a conversational UI to ask open-ended questions about my entire captured knowledge base.

---

## 5. State Management

* **Zustand** is used for all client-side global state in the Next.js web app:
  * `auth-store` — holds the authenticated user (hydrated from server via AuthProvider)
  * `nodes-store` — holds nodes, entities, edges with search filtering and optimistic delete
  * `ui-store` — holds shared UI state like selected node (shared across Feed and Graph views)
* **Persist middleware** can be added to any store for localStorage syncing when needed (e.g., user preferences).
* Data is still fetched in **Server Components** (Next.js best practice) and hydrated into stores via provider components.

---

## 6. Development Phases (For the AI Agent)

When prompting your AI agent, execute in this exact order to prevent context-window collapse and spaghetti code:

* **Sprint 1: The Foundation.** Setup Next.js, Supabase auth, and the database schema (with `pgvector`). *Do not build UI yet.*
* **Sprint 2: The Ingestion Engine.** Setup the Plasmo extension, BYOK local storage logic, DOM scraping, and the Vercel AI SDK integration to generate the JSON summaries.
* **Sprint 3: The Brain.** Connect the extension to Supabase. Save the captured data, generate embeddings, and write the auto-linking SQL functions.
* **Sprint 4: The Interface.** Build the Next.js dashboard using Shadcn UI. Implement the React Flow graph visually.
* **Sprint 5: The Memory.** Build the Spaced Repetition logic and Review UI.

---

## 7. Guardrails & Constraints

* **Privacy First:** For Tier 1 users, API calls to the LLM must happen *directly* from the browser extension to the LLM provider (OpenAI/Anthropic) using the user's local key. Do not route Tier 1 data through our Next.js backend.
* **Performance:** React Flow can get laggy with 1000+ nodes. Implement pagination or "local cluster viewing" (only showing nodes 2 degrees of separation from the currently selected node).
* **Fallbacks:** If a YouTube video has no captions, the extension must gracefully show an error toast (`"No transcript available to capture."`) rather than crashing.
