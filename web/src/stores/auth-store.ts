import { create } from 'zustand'
import type { AuthUser } from '@/lib/types'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean

  /** Called by AuthProvider to hydrate from server-fetched user */
  setUser: (user: AuthUser | null) => void
  /** Reset store on sign out */
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}))
