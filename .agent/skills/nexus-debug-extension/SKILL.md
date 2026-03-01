---
name: nexus-debug-extension
description: Troubleshooting steps for the Plasmo browser extension, background scripts, content scripts, and DOM manipulation. Use this when the extension fails to capture data, communicate, or save keys.
---

# Plasmo Extension Debugging Protocol

## 1. Cross-Origin (CORS) & CSP Blocks
- **Symptom:** Fetch requests to the LLM (OpenAI/Anthropic) fail with a CORS error or "Refused to connect".
- **Action:** Ensure the `manifest.json` (via Plasmo config) includes the proper `host_permissions` (e.g., `"*://api.openai.com/*"`). 
- **Action:** Extension background workers usually bypass CORS, but content scripts do not. Move the LLM fetch logic to the `background.ts` file and communicate via `chrome.runtime.sendMessage`.

## 2. Content Script Injection Failures
- **Symptom:** The floating "Capture" button does not appear on the page.
- **Action:** Check the `matches` array in the content script config. Ensure it is not restricted to a specific domain unless intended.
- **Action:** Single Page Applications (SPAs) like YouTube change routes without reloading. Use a `MutationObserver` to ensure the button re-injects if the DOM changes.

## 3. Storage & BYOK Failures
- **Symptom:** The API key is saved but immediately lost, or the LLM call says "Unauthorized".
- **Action:** Use `@plasmohq/storage`. Remember that storage is asynchronous. Always `await storage.get("apiKey")` before making the API call.

## 4. DOM Scraper Hallucinations
- **Symptom:** The extracted text is full of HTML tags, script tags, or is completely empty.
- **Action:** Use `document.body.innerText` for a safe fallback, but preferably target specific semantic tags (`article`, `main`). Strip all `<script>` and `<style>` nodes before processing.