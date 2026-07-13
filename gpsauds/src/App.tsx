import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { RootLayout, AuthLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute, GuestRoute } from '@/components/shared/RouteGuards'
import { PageLoader } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { tokenStorage } from '@/api/client'

// ── Lazy pages ────────────────────────────────────────────────────────────────

import { HomePage } from '@/pages/Home'
import { AcademicsPage } from '@/pages/Academics'
import { EventsPage, EventDetailPage } from '@/pages/Events'
import {
  WelfarePage, OpportunitiesPage, NewsPage, NewsDetailPage,
  NotificationsPage
} from '@/pages/other-pages'
import { AboutPage } from '@/pages/AboutPage'
import { GalleryPage } from '@/pages/GalleryPage'
import {
  ProfilePage, CertificatesPage, CertificateVerifyPage, SettingsPage
} from '@/pages/profile-pages'
import {
  LoginPage, RegisterPage, ForgotPasswordPage, VerifyEmailPage
} from '@/pages/auth'

// ── QueryClient ───────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if ((error as { response?: { status?: number } })?.response?.status &&
            (error as { response?: { status?: number } }).response!.status! < 500) {
          return false
        }
        return failureCount < 2
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

// ── Auth initialiser ──────────────────────────────────────────────────────────

function AuthInitialiser() {
  const { isAuthenticated, fetchMe, reset } = useAuthStore()

  useEffect(() => {
    // Listen for forced logout from token interceptor
    const handler = () => reset()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [reset])

  useEffect(() => {
    // Rehydrate user from stored token on page load
    const access = tokenStorage.getAccess()
    const refresh = tokenStorage.getRefresh()
    if ((access || refresh) && !isAuthenticated) {
      fetchMe()
    }
  }, [])

  return null
}

// ── 404 ───────────────────────────────────────────────────────────────────────

function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <span className="text-8xl mb-6">🔭</span>
      <h1 className="font-display text-5xl font-bold text-green-700 mb-3">404</h1>
      <p className="text-green-600 text-lg mb-8">This page doesn't exist.</p>
      <a href="/" className="btn-md btn-primary">Back to Home</a>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitialiser />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes with full layout ─────────────────────────── */}
            <Route element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="academics" element={<AcademicsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              {/* New standalone pages */}
              <Route path="about" element={<AboutPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="welfare" element={<WelfarePage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="news/:id" element={<NewsDetailPage />} />
              <Route path="certificates/verify" element={<CertificateVerifyPage />} />

              {/* ── Protected routes ─────────────────────────────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="certificates" element={<CertificatesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* ── Auth routes (no layout) ─────────────────────────────────── */}
            <Route element={<AuthLayout />}>
              <Route element={<GuestRoute />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
              </Route>
              <Route path="verify-email" element={<VerifyEmailPage />} />
            </Route>

            {/* ── 404 ──────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}