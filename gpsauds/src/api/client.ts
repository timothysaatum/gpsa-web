import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
const ACCESS_KEY = 'gpsa_access_token'
const REFRESH_KEY = 'gpsa_refresh_token'

// ── Token storage — sessionStorage for access, localStorage for refresh ───────
// Access token in sessionStorage: cleared on tab close
// Refresh token in localStorage: persists across sessions

export const tokenStorage = {
  getAccess:     ()       => sessionStorage.getItem(ACCESS_KEY),
  setAccess:     (t: string) => sessionStorage.setItem(ACCESS_KEY, t),
  removeAccess:  ()       => sessionStorage.removeItem(ACCESS_KEY),

  getRefresh:    ()       => localStorage.getItem(REFRESH_KEY),
  setRefresh:    (t: string) => localStorage.setItem(REFRESH_KEY, t),
  removeRefresh: ()       => localStorage.removeItem(REFRESH_KEY),

  clear: () => {
    sessionStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach access token ─────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — silent refresh on 401 ─────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Only attempt refresh on 401, and not on auth endpoints themselves
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = tokenStorage.getRefresh()

      if (!refreshToken) {
        tokenStorage.clear()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        tokenStorage.setAccess(data.access_token)
        tokenStorage.setRefresh(data.refresh_token)

        processQueue(null, data.access_token)

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${data.access_token}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clear()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── Typed API helpers ─────────────────────────────────────────────────────────

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.errors)) {
      return data.errors.map((e: { message: string }) => e.message).join(' · ')
    }
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}

export default api
