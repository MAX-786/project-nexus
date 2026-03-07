'use client'

import { useRef, useEffect } from 'react'

import type { AuthUser } from '@/lib/types'
import { useAuthStore } from '@/stores/auth-store'

interface AuthProviderProps {
  user: AuthUser | null
  children?: React.ReactNode
}

/**
 * Hydrates the Zustand auth store from server-fetched user data.
 * Place this inside the dashboard layout (or any authenticated boundary).
 */
export default function AuthProvider({ user, children }: AuthProviderProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      setUser(user)
      hydrated.current = true
    }
  }, [user, setUser])

  return <>{children}</>
}
