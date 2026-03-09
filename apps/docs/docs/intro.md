---
slug: /
sidebar_position: 1
---

# Introduction

**Project Nexus** is an open-source, privacy-first knowledge management system. It automatically captures web content, generates AI summaries, builds a visual knowledge graph, and helps you retain everything through spaced repetition — all while keeping your data under your complete control.

> **"Your Second Brain. Not Big Tech's."**

---

## What is Project Nexus?

Project Nexus consists of two parts:

1. **Browser Extension** — A [Plasmo](https://www.plasmo.com/)-based Chrome extension that captures articles and YouTube transcripts with a single click, processes them with AI using *your own API key*, and stores the results to your personal database.

2. **Web Dashboard** — A [Next.js](https://nextjs.org/) application where you view, organize, and interact with your captured knowledge through a feed, a visual graph, spaced repetition reviews, and an AI memory agent.

---

## Core Features

| Feature | Description |
|---|---|
| **Intelligent Capture** | Scrapes article text or YouTube transcripts and generates AI summaries and entity tags. |
| **Knowledge Graph** | Auto-links related nodes using vector embeddings. Visualized on a 2D canvas with React Flow. |
| **Spaced Repetition** | Daily review queue based on the SuperMemo-2 (SM-2) algorithm to maximize retention. |
| **Memory Agent** | Background AI consolidation of your captured knowledge into overarching themes. |
| **Collections** | Organize captured nodes into custom, named collections with bulk operations. |
| **Virtualized Feed** | Smooth, performant scrolling even with tens of thousands of nodes. |
| **BYOK Privacy** | All AI calls go directly from your browser to your chosen LLM provider. Nothing routes through our servers. |

---

## Who Is This For?

- **Researchers and students** who want to build a personal knowledge base from articles and videos.
- **Developers and engineers** who want full control over their data and AI pipeline.
- **Knowledge workers** who want a tool that actually helps them *retain* what they read.

---

## Quick Navigation

- **New user?** Start with [Installation](./getting-started/installation.md).
- **Want to capture your first article?** See [First Capture](./getting-started/first-capture.md).
- **Looking for how-to guides?** Check the [How-To Guides](./how-to/capture-your-first-article.md) section.
- **Deploying to production?** See the [Deployment](./deployment/vercel.md) section.
- **Contributing?** Read the [Contributing Guide](./development/contributing.md).
