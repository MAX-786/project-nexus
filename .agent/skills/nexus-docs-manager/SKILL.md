---
name: nexus-docs-manager
description: Rules for creating, updating, and managing project documentation. Use this skill when analyzing Git commits, updating the README, writing API specs, or acting as the Technical Writer for Project Nexus.
---

# Project Nexus: Documentation Manager Protocol

## 1. Documentation System

Project Nexus uses **[Docusaurus v3](https://docusaurus.io/)** as its documentation manager. The docs site lives at `apps/docs/` and is part of the pnpm monorepo.

### Running the Docs Site

```bash
# Start the Docusaurus dev server (port 3001)
pnpm --filter @nexus/docs start

# Or start all services together
pnpm dev
```

### Building for Production

```bash
pnpm --filter @nexus/docs build
```

## 2. The Single Source of Truth (SSoT) Philosophy

- The documentation (`README.md`, `prd.md`, and files in `apps/docs/docs/`) is the definitive Single Source of Truth.
- If the code deviates from the documentation, either the code is a bug, or the documentation is outdated. Determine which is true and align them.
- **Zero Redundancy:** Never document the same concept in two places. Use markdown links to reference existing information instead of duplicating it.

## 3. Documentation Structure

All user-facing docs live in `apps/docs/docs/`. The sidebar is configured in `apps/docs/sidebars.ts`.

```
apps/docs/docs/
├── intro.md                         # Landing page (slug: /)
├── getting-started/
│   ├── installation.md              # Full installation guide
│   ├── byok-setup.md                # BYOK API key configuration
│   └── first-capture.md             # First capture walkthrough
├── how-to/                          # Task-oriented user guides
│   ├── capture-your-first-article.md
│   ├── build-your-knowledge-graph.md
│   ├── use-spaced-repetition.md
│   ├── use-memory-agent.md
│   ├── manage-collections.md
│   └── search-your-knowledge.md
├── features/                        # Feature reference docs
│   ├── extension/
│   │   ├── overview.md
│   │   ├── capturing.md
│   │   └── settings.md
│   └── dashboard/
│       ├── feed.md
│       ├── knowledge-graph.md
│       ├── review.md
│       ├── memory.md
│       ├── collections.md
│       └── settings.md
├── deployment/
│   ├── vercel.md
│   ├── supabase-cloud.md
│   └── self-hosted.md
├── development/
│   ├── local-setup.md
│   ├── local-supabase.md
│   ├── architecture.md
│   └── contributing.md
└── reference/
    ├── environment-variables.md
    ├── database-schema.md
    └── byok-model.md
```

Other documentation files (not in Docusaurus):

| File | Audience | Purpose |
|---|---|---|
| `README.md` | Open-source users | Marketing pitch, high-level features, Quick Start. |
| `prd.md` | Maintainers / AI agents | Internal architecture, DB schema, roadmap. |
| `.env.example` | Developers | Canonical list of all environment variables. |

## 4. Git Commit Analysis & Auto-Documentation Protocol

Before writing or updating docs, proactively analyse recent changes:

1. **Analyse:** Review the latest Git commits (`git log -n 5` or the current PR diff).
2. **Filter:** Ignore `chore`, `style`, and minor `refactor` commits. Focus on `feat`, `fix` (if it changes user behaviour), and `perf`.
3. **Cross-Reference:** Search the existing documentation to see if the new feature is already mentioned.
4. **Execute:**
   - If missing: Add a new doc page in the correct section or update the relevant existing page.
   - If outdated: Update the existing text in place.
   - If deprecated/removed: Delete the corresponding documentation. Do not leave "ghost" features in the docs.

## 5. CRUD Operations on Documentation

- **READ FIRST:** Before injecting any text, read the entire markdown file to understand its existing structure.
- **UPDATE over APPEND:** Integrate new information into the relevant existing section, not at the bottom.
- **DELETE Fearlessly:** If a feature is removed from the codebase, hunt down its mention in the docs and delete it.
- **FORMATTING:** Use standard Markdown. Code blocks must always specify a language (e.g., ` ```typescript `). Use tables for structured data.

### Adding a New Doc Page

1. Create the file in the correct directory under `apps/docs/docs/`.
2. Add the required frontmatter at the top:
   ```markdown
   ---
   sidebar_position: N
   ---
   ```
3. Add the new file ID to `apps/docs/sidebars.ts` in the correct category.

### Updating the Sidebar

Edit `apps/docs/sidebars.ts`. The `id` field in sidebar items maps to the file path relative to `apps/docs/docs/` (without `.md`). For example, the file `apps/docs/docs/how-to/use-memory-agent.md` has the id `how-to/use-memory-agent`.

## 6. Docusaurus-Specific Features

Use these Docusaurus admonitions where appropriate:

```markdown
:::tip
A helpful tip for the user.
:::

:::note
Additional context that is worth knowing.
:::

:::warning
Something the user should be careful about.
:::

:::danger
A destructive or irreversible action warning.
:::
```

## 7. Tone and Style

- **Concise & Developer-Centric:** Write like an experienced engineer talking to another engineer. Use imperative verbs ("Run the server," "Set the API key").
- **Accuracy First:** Never hallucinate features, CLI commands, or file paths that do not exist in the actual codebase. Always verify against the actual code before documenting.
- **User-Oriented How-Tos:** How-to guides should be written from the user's perspective with numbered steps. Focus on the task, not the implementation.
- **Consistency:** Maintain consistent formatting and structure across all documentation files.
