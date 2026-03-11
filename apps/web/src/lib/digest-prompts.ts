/** Build digest generation prompt from recent nodes */
export function buildDigestPrompt(nodes: { title: string; summary: string; url: string }[]) {
  return `You are a knowledge assistant. Analyze these recently captured articles and create a concise daily digest.

ARTICLES (captured in last 24 hours):
${nodes.map((n, i) => `${i + 1}. "${n.title}" — ${n.summary}`).join('\n')}

Create a digest with:
1. A brief overview paragraph summarizing what was captured
2. Key connections or patterns between articles
3. Actionable insights or review suggestions

Respond in this exact JSON format:
{
  "content": "Brief overview paragraph",
  "insights": ["insight 1", "insight 2", "insight 3"]
}

Keep it concise and actionable.`
}
