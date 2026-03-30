import { create } from 'zustand'

import type { PublicUser } from '../lib/api'
import { getMe, login as loginApi, logout as logoutApi, refresh } from '../lib/api'

export type AuthUser = PublicUser

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string | null,
  ) => void
  login: (payload: { email: string; password: string }) => Promise<AuthUser>
  refreshSession: () => Promise<AuthUser | null>
  logout: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    set({ user, accessToken, refreshToken })
  },
  login: async (payload) => {
    const res = await loginApi(payload)
    set((s) => ({
      ...s,
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    }))
    localStorage.setItem('accessToken', res.accessToken)
    localStorage.setItem('refreshToken', res.refreshToken)
    return res.user
  },
  refreshSession: async () => {
    const rt = localStorage.getItem('refreshToken')
    if (!rt) {
      set({ user: null, accessToken: null, refreshToken: null })
      return null
    }
    const res = await refresh(rt)
    localStorage.setItem('accessToken', res.accessToken)
    localStorage.setItem('refreshToken', res.refreshToken)
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    })
    return res.user
  },
  logout: async () => {
    const rt = localStorage.getItem('refreshToken')
    if (rt) {
      try {
        await logoutApi(rt)
      } catch {
        // ignore logout errors; we still clear the client session
      }
    }
    set({ user: null, accessToken: null, refreshToken: null })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
  clearSession: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

// Lightweight hydration helper for components (avoid wiring into the store create config).
export async function hydrateAuthMe() {
  const accessToken = localStorage.getItem('accessToken')
  if (!accessToken) return null
  return getMe()
}
