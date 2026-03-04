# Project Nexus: Your Second Brain. Not Big Tech's.

Project Nexus is an open-source, **Privacy-First (BYOK)** knowledge management system. It automatically captures web content, generates AI summaries, builds a visual knowledge graph, and helps you remember everything through spaced repetition—all while keeping your data under your control.

---

## 🚀 Key Features

*   **⚡ Intelligent Capture**: A browser extension that scrapes articles and YouTube transcripts with a single click.
*   **🧠 AI-Powered Insights**: Automatic summarization and entity extraction (people, tools, concepts) using your preferred LLM.
*   **🕸️ Knowledge Graph**: A dynamic, 2D visual canvas (React Flow) that automatically links related nodes using vector embeddings.
*   **📅 Spaced Repetition**: A gamified review system (SuperMemo-2) to ensure long-term retention of your captured knowledge.
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
├── supabase_setup.sql # Database schema and RLS policies
└── prd.md            # Product Requirements Document
```

---

## 🏁 Getting Started

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   A [Supabase](https://supabase.com/) project (Self-hosted or Cloud)

### 2. Database Setup
1.  Run the contents of `supabase_setup.sql` in your Supabase SQL Editor.
2.  Enable the `pgvector` extension if not already active.

### 3. Web Dashboard Setup
```bash
cd apps/web
cp .env.local.example .env.local # Update with your Supabase credentials
npm install
npm run dev
```

### 4. Browser Extension Setup
```bash
cd apps/extension
cp .env.local.example .env.local # Update with your Supabase credentials
npm install
npm run dev
```
*   Load the `apps/extension/build/chrome-mv3-dev` folder into Chrome as an "Unpacked Extension".

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
