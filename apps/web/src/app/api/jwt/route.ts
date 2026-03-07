import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // If browser request, show a friendly page
    const accept = request.headers.get("accept") || ""
    if (accept.includes("text/html")) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html><head><title>Nexus — Get Token</title>
        <style>body{font-family:system-ui;background:#0c0c14;color:#e0e0e8;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
        .card{max-width:400px;text-align:center;padding:2rem;border:1px solid #1e1e2e;border-radius:1rem;background:#13131f}
        a{color:#7c5cfc;text-decoration:none}a:hover{text-decoration:underline}</style>
        </head><body><div class="card">
        <h2>Not signed in</h2>
        <p style="color:#8888a0;font-size:14px;margin:1rem 0">Please <a href="/login">sign in</a> first, then visit this page again to get your token.</p>
        </div></body></html>`,
        { status: 401, headers: { "Content-Type": "text/html" } }
      )
    }
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accept = request.headers.get("accept") || ""
  if (accept.includes("text/html")) {
    // Show a copy-friendly page
    return new NextResponse(
      `<!DOCTYPE html>
      <html><head><title>Nexus — Your Token</title>
      <style>body{font-family:system-ui;background:#0c0c14;color:#e0e0e8;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
      .card{max-width:520px;padding:2rem;border:1px solid #1e1e2e;border-radius:1rem;background:#13131f}
      h2{margin:0 0 .5rem}p{color:#8888a0;font-size:13px;margin:.5rem 0 1.5rem}
      .token{background:#0c0c14;border:1px solid #1e1e2e;border-radius:.5rem;padding:.75rem;font-family:monospace;font-size:11px;word-break:break-all;color:#7c5cfc;max-height:120px;overflow-y:auto;user-select:all}
      .hint{color:#8888a0;font-size:11px;margin-top:1rem}</style>
      </head><body><div class="card">
      <h2>🔑 Your Auth Token</h2>
      <p>Copy this token and paste it in the Nexus extension settings.</p>
      <div class="token">${session.access_token}</div>
      <p class="hint">This token expires periodically. If captures stop working, visit this page again for a fresh token.</p>
      </div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  }

  return NextResponse.json({ jwt: session.access_token });
}
