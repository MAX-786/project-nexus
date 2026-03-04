---
name: nexus-github-cli
description: Manage tasks, bugs, and feature planning using GitHub Issues and Pull Requests via the `gh` CLI. Actively offload project state, requirements, and progress tracking to GitHub to preserve the active AI context window. Only retrieve the minimum necessary data required for the immediate task.
---

# Agent Skill: GitHub CLI Project & Context Management

## Core Objective
Manage tasks, bugs, and feature planning using GitHub Issues and Pull Requests via the `gh` CLI. Actively offload project state, requirements, and progress tracking to GitHub to preserve the active AI context window. Only retrieve the minimum necessary data required for the immediate task.

## 1. Context Preservation Strategy (The "External Memory" Rule)
* **Never rely on chat history for project state.** The source of truth is always GitHub.
* **Query narrowly.** Use specific flags (`--label`, `--state open`, `--assignee`, `--limit`) to fetch only relevant issues.
* **Summarize before closing.** Before finishing a sub-task, update the relevant issue with a concise summary of decisions made or roadblocks hit.

## 2. Issue Management (`gh issue`)
Issues are used to track every feature, bug, and planning milestone. 

### Creating Issues
Always use templates for consistency and easy parsing.
**Command:** `gh issue create --title "[Type] Short Title" --body-file issue_body.md --label "label-name"`

**Title Guidelines:**
* Prefix with type: `[Feature]`, `[Bug]`, `[Task]`, `[Spike]`.
* Keep it action-oriented and under 50 characters.
* *Example:* `[Feature] Worker onboarding profile screen` or `[Bug] Tailwind styling breaks on mobile view`.

**Body Guidelines (The 3-Part Structure):**
1.  **Context:** 1-2 sentences on why this is needed.
2.  **Acceptance Criteria:** Bulleted list of exactly what constitutes "done."
3.  **Technical Notes:** Any specific constraints (e.g., "Use Expo Router for navigation").

### Tracking "What's Next"
To figure out the next actionable task without exhausting context:
**Command:** `gh issue list --state open --label "next-up" --limit 5`
* *Rule:* Only look at the title and issue number first. Use `gh issue view <number>` only when a specific task is selected to begin work.

## 3. Pull Request Management (`gh pr`)
Every PR must correspond to an Issue. Code should be merged in small, atomic chunks.

### Creating PRs
**Command:** `gh pr create --title "Type: Short Description" --body-file pr_body.md`

**Title Guidelines:**
* Use Conventional Commits format: `feat: add worker auth hook`, `fix: resolve crash on login endpoint`.

**Body Guidelines:**
* **Link the Issue:** Must include `Closes #<Issue_Number>` or `Fixes #<Issue_Number>` on its own line to auto-link and close the issue upon merge.
* **Summary of Changes:** Briefly list what was added/modified.
* **Testing Steps:** Bullet points on how to verify the change.

### Reviewing and Merging
To review the current state of PRs:
**Command:** `gh pr list --state open`
To check CI/CD status before merging:
**Command:** `gh pr checks <number>`

## 4. Workflow & Execution Loop
When starting a new session or completing a task, execute the following loop:

1.  **Assess State:** `gh issue list --state open --assignee "@me"`
2.  **Select Task:** `gh issue view <issue_number>`
3.  **Branch Out:** `git checkout -b feature/issue-<number>-short-desc`
4.  **Execute Work:** Write code, build UI, write tests.
5.  **Draft PR:** Push branch and run `gh pr create`. Ensure the body says `Closes #<number>`.
6.  **Cleanup:** Once merged, delete the local branch and pull the latest `main`.

## 5. Preventing Context Window Exhaustion
* **Avoid:** `gh issue list` (without limits). This dumps the entire backlog into the context.
* **Avoid:** `gh pr diff` on large PRs. If a diff is too large, break the PR into smaller, atomic tasks.
* **Use Comments for Memory:** If a task requires multiple sessions, add a comment before stopping: `gh issue comment <number> --body "WIP: Completed API integration. Next step is wiring up the React Native frontend components."`