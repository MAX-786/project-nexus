---
name: nexus-project-marketing
description: Guidelines for generating marketing copy, Reddit posts, Hacker News launches, and growth strategies for Project Nexus. Use this skill when asked to write public-facing content, launch announcements, or analyze product-market fit.
---

# Project Nexus: Marketing & Growth Protocol

## 1. The Source of Truth (Mandatory First Step)
- **Action:** Before writing ANY marketing content, you MUST read the `README.md` file in the project root to understand the current, live feature set. Do not hallucinate features that have not been built yet. If a feature is in the PRD but not the README, clearly label it as "Coming Soon" or "On the Roadmap."

## 2. Core Messaging Pillars (What to Emphasize)
1. **Privacy & Control (BYOK):** "Your Second Brain. Not Big Tech's." Emphasize that users bring their own API keys and own their database.
2. **Frictionless Capture:** No context switching. Save and summarize without leaving the video or article.
3. **The Graph:** It’s not a digital graveyard; it auto-links concepts visually.
4. **Active Recall:** Saving is useless without remembering. Highlight the gamified Tinder-style spaced repetition.

## 3. Brand Tone & Voice
- **Authentic & Humble:** We are building in public. Acknowledge that this is an early prototype/MVP. Ask for feedback, do not demand adoption.
- **Anti-Marketing Fluff:** Avoid words like "Revolutionary," "Game-changing," or "Ultimate." Developers and productivity nerds hate corporate speak.
- **Technical Transparency:** Be open about the stack (Next.js, Supabase, pgvector, Plasmo) and the challenges of building it.

## 4. Platform-Specific Playbooks

### A. Reddit (e.g., r/opensource, r/selfhosted, r/productivity, r/PKMS)
- **Format:** Start with a clear, relatable problem statement. "I was tired of saving 100 links a week and never reading them..."
- **Rule:** Do not write a sales pitch. Frame the post as a "Show and Tell" or a request for genuine architectural/feature feedback.
- **Content:** Include a GitHub link, invite people to roast the code, and explicitly ask if they would use a self-hosted version vs. a managed cloud version.

### B. Hacker News (Show HN)
- **Format:** Deeply technical. Explain *how* the vector search works and *why* you chose the BYOK model.
- **Rule:** Anticipate skepticism about LLM costs and data privacy. Address them proactively in the first comment.

### C. Build-in-Public (X / Twitter / LinkedIn)
- **Format:** Short, visual milestones. "Today I got the React Flow nodes auto-linking based on vector similarity."
- **Rule:** Always include a screenshot, GIF, or a code snippet showing the feature in action.

## 5. Community Engagement 
- When generating responses to hypothetical user comments, default to thanking them for the feedback, agreeing with valid critiques, and adding their suggestions to the open-source issue tracker.
