'use client'

import { Brain, CheckCircle2, Loader2, LogIn, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { createClient } from '@/utils/supabase/client'

type Status = 'loading' | 'sending' | 'success' | 'not-signed-in' | 'no-extension'

export default function ExtensionAuthPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let timeoutId: ReturnType<typeof setTimeout>

    const handleConfirmation = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'NEXUS_EXTENSION_AUTH_SUCCESS') return

      setStatus('success')
      window.removeEventListener('message', handleConfirmation)
      clearTimeout(timeoutId)

      // Auto-close the tab after a brief success display
      setTimeout(() => window.close(), 2000)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatus('not-signed-in')
        return
      }

      setUserEmail(session.user.email ?? null)
      setStatus('sending')

      // Post the session to the extension content script via postMessage.
      // The content script (auth-callback.ts) runs on this exact page and listens for this message.
      window.postMessage(
        {
          type: 'NEXUS_EXTENSION_AUTH',
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: {
              id: session.user.id,
              email: session.user.email,
            },
          },
        },
        window.location.origin,
      )

      // Listen for confirmation from the extension content script
      window.addEventListener('message', handleConfirmation)

      // If no confirmation within 4 seconds, the extension may not be installed
      timeoutId = setTimeout(() => {
        window.removeEventListener('message', handleConfirmation)
        setStatus('no-extension')
      }, 4000)
    })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('message', handleConfirmation)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.637_0.237_275/6%)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)] mb-4">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nexus Extension</h1>
          <p className="text-sm text-muted-foreground mt-1">Connecting your browser extension…</p>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10 p-8 text-center">
          {status === 'loading' && (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Checking your session…</p>
            </div>
          )}

          {status === 'sending' && (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">Connecting to extension…</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground">Signed in as {userEmail}</p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Extension connected!
              </p>
              <p className="text-xs text-muted-foreground">This tab will close automatically.</p>
            </div>
          )}

          {status === 'not-signed-in' && (
            <div className="space-y-4">
              <XCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Not signed in</p>
                <p className="text-xs text-muted-foreground">
                  Sign in to your Nexus account first, then come back here to connect your
                  extension.
                </p>
              </div>
              <Link
                href={`/login?next=${encodeURIComponent('/auth/extension')}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </div>
          )}

          {status === 'no-extension' && (
            <div className="space-y-4">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Extension not detected</p>
                <p className="text-xs text-muted-foreground">
                  Make sure the Nexus extension is installed and enabled, then try again.
                </p>
              </div>
              <button
                onClick={() => {
                  setStatus('sending')
                  // Re-trigger the auth flow
                  window.location.reload()
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
