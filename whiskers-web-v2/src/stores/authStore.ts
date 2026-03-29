import { create } from 'zustand'

export type AuthUser = {
  id: string
  email: string
  role: string
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  setSession: (user: AuthUser, accessToken: string) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ user, accessToken })
  },
  clearSession: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null })
  },
}))
