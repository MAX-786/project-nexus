---
name: nexus-extension-dev
description: Guidelines for developing the Plasmo browser extension for Project Nexus, including DOM extraction, background workers, and local storage. Use this when writing background scripts, content scripts, or extension UI.
---

# Plasmo Extension Guidelines

## Extension Architecture
1. **Framework:** Use the Plasmo framework (`plasmo.com`).
2. **Content Scripts (`content.tsx`):** Used strictly for injecting UI into the current webpage (e.g., the floating "Capture" button) and extracting text from the DOM.
3. **Background Scripts (`background.ts`):** Used for handling heavy logic, routing, and Vercel AI SDK calls. 
4. **Popup/Options:** Use React and TailwindCSS for the extension popup UI.

## Data Extraction Rules
1. **Clean Text:** When scraping a page, do not grab the raw HTML. Extract `innerText` from the `<article>`, `<main>`, or `<body>` tags. Remove navigation bars and footers to save LLM context window tokens.
2. **YouTube Transcripts:** If `window.location.hostname` includes "youtube.com", attempt to parse the transcript data natively or prompt the user to open the transcript panel.

## Security & Storage
- Use `@plasmohq/storage` to save and retrieve the user's BYOK API keys securely.
- Ensure proper Content Security Policies (CSP) are configured in the Plasmo manifest to allow outward API calls to LLM providers.