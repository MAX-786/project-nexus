---
name: nexus-docs-manager
description: Rules for creating, updating, and managing project documentation. Use this skill when analyzing Git commits, updating the README, writing API specs, or acting as the Technical Writer for Project Nexus.
---

# Project Nexus: Documentation Manager Protocol

## 1. The Single Source of Truth (SSoT) Philosophy
- The documentation (`README.md`, PRD, and files within the `docs/` folder) is the definitive Single Source of Truth for how the system *should* work.
- If the code deviates from the documentation, either the code is a bug, or the documentation is outdated. You must determine which is true and align them.
- **Zero Redundancy:** Never document the exact same concept in two different places. Use markdown links (`[Link Text](./path/to/doc.md)`) to reference existing information instead of duplicating it.

## 2. Git Commit Analysis & Auto-Documentation Protocol
Before writing or updating docs, you must proactively analyze recent changes:
1. **Analyze:** Review the latest Git commits (`git log -n 5` or the current PR diff). 
2. **Filter:** Ignore `chore`, `style`, and minor `refactor` commits. Focus strictly on `feat`, `fix` (if it changes user behavior), and `perf`.
3. **Cross-Reference:** Search the existing documentation to see if the new feature or changed behavior is already mentioned.
4. **Execute:** - If missing: Add it to the relevant section.
   - If outdated: Update the existing text.
   - If deprecated/removed in the code: **Delete** the corresponding documentation immediately. Do not leave "ghost" features in the docs.

## 3. CRUD Operations on Documentation
When performing CRUD (Create, Read, Update, Delete) on markdown files, follow these strict rules:

- **READ FIRST (Crucial):** Before injecting any text, read the entire markdown file to understand its structure, headings, and existing content.
- **UPDATE over APPEND:** Do not lazily append new information to the bottom of a file. Integrate new information seamlessly into the relevant existing section. 
- **DELETE Fearlessly:** If a feature, environment variable, or API endpoint is removed from the codebase, you MUST hunt down its mention in the docs and delete it. 
- **FORMATTING:** Use standard Markdown. Code blocks must always have a language specified (e.g., \`\`\`typescript). Use tables for environment variables or API parameters.

## 4. Documentation Structure & Locations
Maintain strict boundaries for where information lives:
- `README.md`: The marketing pitch, high-level features, Quick Start guide, and link to the detailed docs. (Target audience: Open-source users).
- `prd.md`: The internal architectural source of truth, database schemas, and future roadmaps. (Target audience: You, the AI agent, and the maintainers).
- `docs/setup.md`: Deep-dive instructions for BYOK, Supabase local hosting, and Vercel deployments.
- `.env.example`: Must be kept in perfect sync with the actual required environment variables in the codebase. If you add `process.env.NEW_VAR`, you MUST add it here with a dummy value and a comment explaining its purpose.
- `docs/` folder: All other documentation files. (Target audience: Open-source users).

## 5. Tone and Style
- **Concise & Developer-Centric:** Write like an experienced engineer talking to another engineer. Avoid marketing fluff (e.g., "Incredible new feature!"). Use imperative verbs ("Run the server," "Set the API key").
- **Accuracy First:** Never hallucinate features, CLI commands, or file paths that do not exist in the actual codebase.
- **Consistency:** Maintain consistent formatting and structure across all documentation files.
- **Clarity:** Use clear, concise language and avoid jargon unless it is common knowledge for the target audience.
- **Organization:** Group related information together and use clear headings and subheadings to make it easy to navigate.
