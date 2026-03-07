import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

/**
 * Handles the redirect after Supabase email confirmation.
 * Exchanges the `code` query param for a session, then redirects to /dashboard.
 *
 * TODO: This route is OPTIONAL for MVP (email confirmation can be disabled in
 * Supabase dashboard). Make this REQUIRED once email verification is enforced.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code is missing or exchange failed, redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('Could not verify email. Please try again.')}`
  )
}
