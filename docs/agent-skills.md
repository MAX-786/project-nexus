# Agent Skills Index

Custom agent skills are stored under the hidden `.agent/skills/` directory at the root of the repo. They are available to AI assistants when needed—no extra wiring required. Each skill folder contains a `SKILL.md` with its name, description, and when to apply it.

| Folder | Skill name | Purpose / When to use |
| --- | --- | --- |
| `nexus-code-quality` | `nexus-code-quality` | ESLint/Prettier/TypeScript strictness rules for new code, refactors, and type-related build fixes. |
| `nexus-debug-backend` | `nexus-debug-backend` | Troubleshooting Supabase, `pgvector`, RLS, and Vercel AI SDK issues. |
| `nexus-debug-extension` | `nexus-debug-extension` | Debugging Plasmo extension background/content scripts and DOM capture issues. |
| `nexus-debug-frontend` | `nexus-debug-frontend` | Debugging Next.js App Router UI, React state, routing, hydration, and React Flow. |
| `nexus-deployments` | `nexus-deployments` | Deployment protocols for Vercel (web), Chrome Web Store packaging, and Supabase migrations. |
| `nexus-docs-manager` | `nexus-docs-manager` | Creating and updating docs, README changes, API specs, and technical writing. |
| `nexus-extension-dev` | `nexus-extension-dev` | Building Plasmo extension features: DOM extraction, background workers, local storage. |
| `nexus-git-workflow` | `nexus-git-workflow` | Git branching, Conventional Commits, and PR structure guidance. |
| `nexus-github-cli` | `nexus-github-cli` | Running the dev lifecycle via `gh`: boards, milestones, issues, and PRs. |
| `nexus-nextjs-dev` | `nexus-nextjs-dev` | Next.js App Router + Shadcn UI + Tailwind guidelines for client/server interactions. |
| `nexus-project-marketing` | `nexus-marketing-growth` | Marketing and launch copy (Reddit, HN), growth strategies, PMF analysis. |
| `nexus-project-rules` | `nexus-project-rules` | Core architectural rules, tech stack, and privacy constraints for Project Nexus. |
| `nexus-supabase-db` | `nexus-supabase-db` | Supabase/PostgreSQL/pgvector usage, RLS, and vector search logic. |
| `nexus-ui-ux` | `nexus-ui-ux` | UI/UX guidelines with Tailwind, Shadcn UI, Lucide icons, and extension UI patterns. |

> Tip: Because `.agent` is a hidden folder, searches may skip it by default. If you need to inspect the raw skill files, include hidden paths (e.g., `find .agent/skills -name "SKILL.md"`).
