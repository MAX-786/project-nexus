import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated The /api/jwt endpoint has been replaced by the seamless
 * one-click extension auth flow at /auth/extension.
 * This route now permanently redirects to the new page.
 */
export async function GET(_request: NextRequest) {
  return NextResponse.redirect(
    new URL("/auth/extension", _request.url),
    { status: 301 }
  );
}
