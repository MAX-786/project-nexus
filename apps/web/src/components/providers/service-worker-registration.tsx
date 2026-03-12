'use client'

import { useEffect } from 'react'

/**
 * Registers the Nexus service worker on the browser side.
 * Rendered once in the root layout; silently no-ops on environments that
 * don't support service workers (e.g. Firefox Private Browsing, older browsers).
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        // Non-fatal: SW registration failure should never break the app.
        console.warn('[SW] Registration failed:', err)
      })
  }, [])

  return null
}
