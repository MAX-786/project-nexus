---
sidebar_position: 4
---

# Contributing

Contributions are welcome! Whether you're fixing a bug, improving documentation, or adding a feature, your help is appreciated.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/project-nexus.git
   cd project-nexus
   ```
3. **Install dependencies**:
   ```bash
   corepack enable
   pnpm install
   ```
4. **Set up your local environment** — see [Local Development Setup](./local-setup.md).

## Branch Naming

Use descriptive branch names:

| Type | Format | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/add-export-to-markdown` |
| Bug fix | `fix/short-description` | `fix/jwt-expiry-toast` |
| Documentation | `docs/short-description` | `docs/add-api-reference` |
| Chore | `chore/short-description` | `chore/update-dependencies` |

## Commit Messages

Follow the **Conventional Commits** convention:

```
feat: add YouTube transcript capture support
fix: correct SM-2 ease factor calculation on "Hard" rating
docs: add memory agent how-to guide
chore: update Docusaurus to 3.9.2
```

Prefixes: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`, `perf`, `test`.

## Pull Request Guidelines

- **One concern per PR** — don't bundle unrelated changes.
- **Describe what and why** — not just what files changed.
- **Include screenshots** for any UI changes.
- **Ensure TypeScript passes**:
  ```bash
  cd apps/web && pnpm exec tsc --noEmit
  ```
- **Follow the existing code style** — Shadcn UI components, Tailwind classes, strict TypeScript.

## Code Conventions

- Default to **Server Components** in Next.js. Only add `"use client"` when necessary.
- All DB mutations go through **Server Actions** (`app/dashboard/*/actions.ts`).
- All queries must be RLS-safe: always include `.eq('user_id', user.id)`.
- Use **Shadcn UI** components for all base elements.
- Use **`toast` from `sonner`** for user-facing notifications.

## Documentation

When adding a new feature:
1. Add or update the relevant page in `apps/docs/docs/`.
2. Update `apps/docs/sidebars.ts` if adding a new page.
3. Follow the doc manager agent skill guidelines at `.agent/skills/nexus-docs-manager/SKILL.md`.

## Reporting Issues

Use [GitHub Issues](https://github.com/MAX-786/project-nexus/issues) to report bugs or request features. Include:
- Steps to reproduce.
- Expected vs. actual behaviour.
- Browser and extension version.
- Relevant console errors.
