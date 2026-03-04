---
name: nexus-github-cli
description: Act as an autonomous project manager and lead developer. Use the GitHub CLI (`gh`) to orchestrate the entire development lifecycle: tracking tasks on Project Boards, organizing Sprints via Milestones, documenting progress via Issue Comments, and executing code changes via Pull Requests. 
---

# Agent Skill: Advanced GitHub CLI Management & Context Orchestration

## 0. CLI Path Configuration (IMPORTANT)
The GitHub CLI is installed but **NOT on the system PATH**. You MUST use the full path for all `gh` commands:
```
& "C:\Program Files\GitHub CLI\gh.exe" <args>
```
**Alias shortcut:** At the start of any session that uses `gh`, set an alias first:
```powershell
Set-Alias gh "C:\Program Files\GitHub CLI\gh.exe"
```
Authenticated account: **MAX-786** (via SSH protocol).

## Core Objective
Act as an autonomous project manager and lead developer. Use the GitHub CLI (`gh`) to orchestrate the entire development lifecycle: tracking tasks on Project Boards, organizing Sprints via Milestones, documenting progress via Issue Comments, and executing code changes via Pull Requests. 

**Prime Directive for AI:** The active chat context is ephemeral. GitHub is the permanent brain. You must continuously read from and write to GitHub to maintain project state.

## 1. Token-Optimized Data Retrieval (The JSON Rule)
Never run default `gh` list commands, as human-readable formatting wastes tokens. Always use `--json` and `--jq` to fetch exact data.
* **Bad:** `gh issue list`
* **Good:** `gh issue list --state open --limit 5 --json number,title,labels --jq '.[] | "\(.number): \(.title) [\(.labels[].name)]"'`

## 2. Macro-Management: Projects & Milestones
Organize work into manageable chunks to track overall progress.

### Milestones (Sprints/Releases)
Use milestones to group related issues for a specific release (e.g., v1.0, Sprint 1).
* **List Milestones:** `gh api repos/{owner}/{repo}/milestones -q '.[].title'`
* **Assign Issue to Milestone:** `gh issue edit <issue_number> --milestone "v1.0-alpha"`

### GitHub Projects (Kanban Tracking)
Keep the project board updated so stakeholders know what is happening.
* **Find Project ID:** `gh project list`
* **Add Issue to Board:** `gh project item-add <project_id> --owner <org/user> --url <issue_url>`
* **Update Status (Todo -> In Progress -> Done):** `gh project item-edit --id <item_id> --field-id <status_field_id> --text "In Progress"`

## 3. Meso-Management: Issue Taxonomy & Clustering
Every feature, bug, and architectural decision must be an issue. 

### Issue Tagging Matrix
Always assign a **Type**, **Scope**, and **Priority**.
* **Type:** `bug`, `enhancement`, `epic`, `spike`, `refactor`.
* **Scope:** `frontend`, `backend`, `expo-router`, `tailwind`, `database`.
* **Priority:** `p0-critical`, `p1-high`, `p2-medium`.

### Creating Epics and Sub-Issues
For larger features (e.g., building the Ozgaar worker onboarding flow), use Parent-Child linking.
1. **Create the Epic:** `gh issue create --title "[Epic] Worker Profile Onboarding UI" --body "Tracks the multi-step React Native onboarding flow." --label "epic,frontend"`
2. **Create Sub-Tasks:**
   `gh issue create --title "[Task] Build Image Upload Component with Expo Image Picker" --label "enhancement,frontend"`
3. **Link them (Markdown Checklists):** Update the Epic's body to track the sub-tasks:
   ````markdown
   ### Implementation Steps
   - [ ] #45 Build Image Upload Component
   - [ ] #46 Implement Tailwind CSS styling for Profile Form

   ````

## 4. Micro-Management: Execution & Documentation

As you work, document your thought process directly into GitHub.

### The "Context Checkpoint" (Crucial for AI)

Before finishing a prompt response, pausing work, or switching tasks, dump your current context into the issue as a comment.

* **Command:** `gh issue comment <number> --body "### Status Update
* **Completed:** Wired up the React Native form state.
* **Blocker:** The API endpoint is returning a 400 error.
* **Next Step:** Investigate backend validation logic in the next session."`



### AI-Optimized Search

To find a specific past decision without reading the whole codebase:

* **Search Issues/Comments:** `gh search issues "tailwind config" --repo <owner/repo> --json number,title,text --limit 3`

## 5. CI/CD & Pull Request Workflows

Code must be merged automatically and safely.

### Creating the PR

* **Command:** `gh pr create --title "feat: implement worker auth hook" --body "Closes #12. Adds JWT handling to the Expo app."`

### Validating CI/CD (GitHub Actions)

Do not merge if tests or builds are failing.

* **Check Status:** `gh pr checks <number>`
* **View Workflow Failures:** If checks fail, read the logs to debug: `gh run list --branch <branch_name> --limit 1` -> `gh run view <run_id> --log`

### Review & Merge

* **Merge command:** `gh pr merge <number> --squash --delete-branch`

## 6. The Standard Operating Loop

Follow this sequence strictly for every task:

1. **Read Board:** Query open issues assigned to you or labeled `next-up`. (Parse with JSON).
2. **Claim Task:** Assign it to yourself (`gh issue edit <num> --add-assignee "@me"`) and move it to "In Progress" on the Project board.
3. **Branch & Code:** `git checkout -b task/<num>-name`. Write code.
4. **Checkpoint:** Comment on the issue with progress or roadblocks.
5. **PR & Test:** Create PR, link the issue, check `gh run` logs if CI fails.
6. **Merge & Close:** Merge PR, ensure the issue closes, check off the Markdown task list in the Parent Epic.
