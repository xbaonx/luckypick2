import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

interface User {
  id: string
  email?: string
  type: 'guest' | 'registered'
  isAdmin: boolean
  balanceFun: number
  balanceUsdt: number
  walletAddress?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  loginAsGuest: () => Promise<void>
  logout: () => void
  updateBalance: (balanceFun?: number, balanceUsdt?: number) => void
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { access_token, user } = response.data
          const normalizedUser = {
            ...user,
            type: user?.type ?? (user?.email ? 'registered' : 'guest'),
          }
          set({ token: access_token, user: normalizedUser, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', { email, password })
          const { access_token, user } = response.data
          const normalizedUser = {
            ...user,
            type: user?.type ?? (user?.email ? 'registered' : 'guest'),
          }
          set({ token: access_token, user: normalizedUser, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      loginAsGuest: async () => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/guest')
          const { access_token, user } = response.data
          const normalizedUser = {
            ...user,
            type: user?.type ?? (user?.email ? 'registered' : 'guest'),
          }
          set({ token: access_token, user: normalizedUser, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.common['Authorization']
      },

      updateBalance: (balanceFun?: number, balanceUsdt?: number) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            balanceFun: balanceFun !== undefined ? balanceFun : state.user.balanceFun,
            balanceUsdt: balanceUsdt !== undefined ? balanceUsdt : state.user.balanceUsdt,
          } : null
        }))
      },

      refreshProfile: async () => {
        try {
          const res = await api.get('/auth/profile')
          const user = res.data
          if (!user) return
          const normalizedUser = {
            ...user,
            type: user?.type ?? (user?.email ? 'registered' : 'guest'),
          }
          set({ user: normalizedUser })
        } catch (e) {
          // ignore; interceptor will handle auth errors
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
