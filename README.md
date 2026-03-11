# Project Nexus: Your Second Brain. Not Big Tech's.

Project Nexus is an open-source, **Privacy-First (BYOK)** knowledge management system. It automatically captures web content, generates AI summaries, builds a visual knowledge graph, and helps you remember everything through spaced repetition—all while keeping your data under your control.

---

## 🚀 Key Features

*   **⚡ Intelligent Capture**: A browser extension that scrapes articles and YouTube transcripts with a single click.
*   **🧠 AI-Powered Insights**: Automatic summarization and entity extraction (people, tools, concepts) using your preferred LLM.
*   **🕸️ Knowledge Graph**: A dynamic, 2D visual canvas (React Flow) that automatically links related nodes using vector embeddings.
*   **🔖 Bookmarks & Highlights**: Star important nodes, add color-coded text highlights, and assign custom tags.
*   **⚡ Search & Shortcuts**: Filter by date range, sort order, and use keyboard shortcuts (`1-5`) to navigate rapidly.
*   **📅 Spaced Repetition**: A gamified review system (SuperMemo-2) to ensure long-term retention of your captured knowledge.
*   **🤖 Always-On Memory Agent**: Automatic background consolidation of your captured knowledge into overarching themes, queryable via AI.
*   **🗂️ Custom Collections & Bulk Ops**: Organize your captured nodes into specific collections to easily manage and curate your knowledge graph.
*   **🚀 Highly Scalable Feed**: Smooth, virtualized scrolling feed capable of handling tens of thousands of captured nodes without performance degradation.
*   **🔒 Privacy First (BYOK)**: Capture and process data using your own API keys (OpenAI, Anthropic, Gemini) stored locally in your browser.

---

## 🛠️ Tech Stack

*   **Web Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
*   **Extension Framework**: [Plasmo](https://www.plasmo.com/) (React 18, TypeScript)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + `pgvector`)
*   **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/)
*   **Visualization**: [React Flow](https://reactflow.dev/)

---

## 📂 Project Structure

```text
.
├── apps/extension    # Plasmo-based Browser Extension
├── apps/web          # Next.js Web Dashboard & API
├── apps/docs         # Docusaurus Documentation Site
├── supabase_setup.sql # Database schema and RLS policies
└── prd.md            # Product Requirements Document
```

---

## 🏁 Getting Started

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [pnpm](https://pnpm.io/) (v9+)
*   A [Supabase](https://supabase.com/) project (Self-hosted or Cloud)

### 2. Database Setup
1.  Run the contents of `supabase_setup.sql` in your Supabase SQL Editor.
2.  Enable the `pgvector` extension if not already active.

### 3. Environment Variables
```bash
# At the root of the project
cp .env.example .env.local
```
Update `.env.local` with your Supabase credentials and other configuration values.

### 4. Running the Development Server
Project Nexus uses a [turbo](https://turbo.build/) monorepo structure.

```bash
# Install dependencies 
pnpm install

# Start both the web app and extension in development mode
pnpm dev
```

### 5. Loading the Extension
After running `pnpm dev`, load the extension into Chrome:
*   Navigate to `chrome://extensions/`
*   Enable "Developer mode"
*   Click "Load unpacked" and select the `apps/extension/build/chrome-mv3-dev` folder.

For more detailed setup guides, please see our [documentation](https://max-786.github.io/project-nexus/) or run `pnpm --filter @nexus/docs start` to view the full docs site locally.

---

## 🛡️ Privacy & BYOK

Project Nexus follows a **Bring Your Own Key (BYOK)** model. For free-tier users, all AI processing happens directly in the browser extension using keys stored in local storage. Your data never touches our servers unless you opt for a managed hosting plan.

---

## � Open Core Model

Project Nexus follows an **Open Core** philosophy to remain sustainable while staying accessible:

*   **Tier 1: Hacker (Free)**: 100% Open-source code. BYOK (Bring Your Own Key). Use local storage or your own self-hosted Supabase instance.
*   **Tier 2: Nexus Cloud**: Managed database hosting, cross-device sync, and automatic backups.
*   **Tier 3: Nexus Pro**: Managed hosting plus built-in AI credits (no BYOK required) and priority access to new features.

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

1.  **Fork** the repository.
2.  **Create a branch** (`git checkout -b feature/amazing-feature`).
3.  **Commit your changes** (`git commit -m 'Add some amazing feature'`).
4.  **Push to the branch** (`git push origin feature/amazing-feature`).
5.  **Open a Pull Request**.

Please ensure your code follows the existing style and includes proper TypeScript types.

---

## 📜 License

Project Nexus is open-source and released under the [MIT License](LICENSE).
