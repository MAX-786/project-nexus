---
name: nexus-git-workflow
description: Guidelines for Git branching, commit messages (Conventional Commits), and Pull Request structures. Use this skill when asked to commit code, create a branch, or write a PR description.
---

# Project Nexus: Git & Version Control Protocol

## 1. Branch Naming Conventions
Always branch off `main` using descriptive names:
- `feature/` for new features (e.g., `feature/spaced-repetition-ui`)
- `fix/` for bug fixes (e.g., `fix/extension-cors-error`)
- `chore/` for maintenance or dependency updates
- `docs/` for README or documentation updates

## 2. Conventional Commits
All commit messages MUST follow the Conventional Commits specification. This is critical for auto-generating changelogs for our open-source users.
- **Format:** `<type>(<scope>): <subject>`
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- **Examples:**
  - `feat(extension): add BYOK storage logic`
  - `fix(web): resolve hydration error on dashboard`
  - `docs(readme): update deployment instructions`

## 3. Pull Request (PR) Descriptions
When generating a PR description, use the following structure:
- **Problem:** What issue does this PR solve? (Link to an issue if applicable).
- **Solution:** How does this PR solve it? (Brief technical summary).
- **Testing:** How can the reviewer test this? (e.g., "Open the extension, click capture, verify Supabase row is inserted").
- **Screenshots:** Add a placeholder for screenshots if UI changes were made.