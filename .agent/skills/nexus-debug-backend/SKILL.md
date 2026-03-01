---
name: nexus-debug-backend
description: Troubleshooting steps for Supabase, pgvector, Row Level Security (RLS), and Vercel AI SDK integrations. Use this when database queries return empty arrays or AI JSON parsing fails.
---

# Supabase & AI Debugging Protocol

## 1. Supabase RLS Blocking (The "Silent Failure")
- **Symptom:** A database `select` or `insert` query returns an empty array `[]` or silently fails, but no error is thrown.
- **Action:** 99% of the time, this is an RLS policy issue. Ensure the user is authenticated and the policy explicitly allows the action for `auth.uid()`.
- **Action:** *Test query:* Temporarily disable RLS for the specific table (locally) to confirm if RLS is the culprit. Re-enable immediately after fixing the policy.

## 2. Vector Dimension Mismatches
- **Symptom:** "Expected vector(1536), got vector(768)" when inserting into Supabase.
- **Action:** The dimensions of the SQL table MUST match the output of the embedding model. OpenAI `text-embedding-3-small` outputs 1536. If using a local model or different provider, alter the Supabase table to match the exact dimension size.

## 3. AI JSON Parsing Errors
- **Symptom:** The Vercel AI SDK throws a JSON parse error, or the `entities` array is missing.
- **Action:** Do not rely purely on system prompts for JSON formatting. Use `generateObject` from the Vercel AI SDK with a strictly defined Zod schema. 
- **Action:** Ensure the model supports "JSON Mode" (e.g., `response_format: { type: "json_object" }`).

## 4. Edge Function / Serverless Timeouts
- **Symptom:** The `/api/summarize` route returns a 504 Gateway Timeout.
- **Action:** Generating long summaries can take >15 seconds. Ensure the Next.js API route is set to the maximum timeout for the hosting provider, or stream the response back to the client using `streamObject`.