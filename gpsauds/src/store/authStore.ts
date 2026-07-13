import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'
import { tokenStorage } from '@/api/client'
import { authApi } from '@/api/services'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => Promise<void>
  setUser: (user: User) => void
  fetchMe: () => Promise<void>
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (accessToken, refreshToken, user) => {
        tokenStorage.setAccess(accessToken)
        tokenStorage.setRefresh(refreshToken)
        set({ user, isAuthenticated: true })
      },

      logout: async () => {
        const refreshToken = tokenStorage.getRefresh()
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken)
          }
        } catch {
          // Ignore logout errors — clear local state regardless
        } finally {
          tokenStorage.clear()
          set({ user: null, isAuthenticated: false })
        }
      },

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        set({ isLoading: true })
        try {
          const user = await authApi.me()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch {
          tokenStorage.clear()
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      reset: () => {
        tokenStorage.clear()
        set({ user: null, isAuthenticated: false, isLoading: false })
      },
    }),
    {
      name: 'gpsa-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist user object — tokens are handled separately
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
