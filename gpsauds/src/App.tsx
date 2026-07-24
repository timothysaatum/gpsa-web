import { Component, ReactNode, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { RootLayout, AuthLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute, GuestRoute } from '@/components/shared/RouteGuards'
import { PageLoader } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { tokenStorage } from '@/api/client'

// ── Error Boundary ────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred while rendering.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  tokenStorage.clear()
                  try { localStorage.removeItem('gpsa-auth') } catch {}
                  window.location.reload()
                }}
                className="px-5 py-2.5 bg-emerald-700 text-white font-medium text-sm rounded-xl hover:bg-emerald-800 transition"
              >
                Reset Session & Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ── Lazy pages ────────────────────────────────────────────────────────────────

import { HomePage } from '@/pages/Home'
import { AcademicsPage, AcademicResourceDetailPage, AcademicUploadPage } from '@/pages/Academics'
import { EventsPage, EventCreatePage, EventDetailPage } from '@/pages/Events'
import {
  WelfarePage, OpportunitiesPage, OpportunityDetailPage, NewsPage, NewsDetailPage,
  NotificationsPage
} from '@/pages/other-pages'
import { OverviewPage } from '@/pages/overview'
import { HistoryLegacyPage } from '@/pages/HistoryLegacyPage'
import { PastLeadershipPage } from '@/pages/PastLeadershipPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { LeadershipPage } from '@/pages/LeadershipPage'
import { ImpactPage } from '@/pages/ImpactPage'
import { DocumentsFaqPage } from '@/pages/DocumentsFaqPage'
import { ContactPage } from '@/pages/ContactPage'
import {
  ProfilePage, CertificatesPage, CertificateVerifyPage, SettingsPage
} from '@/pages/profile-pages'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import {
  AdminAboutPage, AdminAcademicsPage, AdminAuditLogsPage, AdminContactPage, AdminDashboardPage,
  AdminEventsPage, AdminGalleryPage, AdminGovernancePage, AdminHomePage, AdminImpactPage, AdminLeadershipPage, AdminLegacyPage,
  AdminNewsPage, AdminOpportunitiesPage, AdminSettingsPage, AdminUsersPage,
  AdminWelfarePage,
} from '@/pages/admin/AdminPages'
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <AuthInitialiser />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public routes with full layout ─────────────────────────── */}
              <Route element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route path="academics" element={<AcademicsPage />} />
                <Route path="academics/upload" element={<AcademicUploadPage />} />
                <Route path="academics/:id" element={<AcademicResourceDetailPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/create" element={<EventCreatePage />} />
                <Route path="events/:id" element={<EventDetailPage />} />
                {/* New standalone pages */}
                <Route path="about" element={<OverviewPage />} />
                <Route path="about/history" element={<HistoryLegacyPage />} />
                <Route path="about/leadership" element={<LeadershipPage />} />
                <Route path="about/legacy" element={<PastLeadershipPage />} />
                <Route path="about/impact" element={<ImpactPage />} />
                <Route path="about/governance" element={<DocumentsFaqPage />} />
                <Route path="about/past-leadership" element={<PastLeadershipPage />} />
                <Route path="leadership" element={<LeadershipPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="welfare" element={<WelfarePage />} />
                <Route path="opportunities" element={<OpportunitiesPage />} />
                <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
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

              <Route element={<ProtectedRoute roles={['admin', 'exec']} />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="home" element={<AdminHomePage />} />
                  <Route path="about" element={<AdminAboutPage />} />
                  <Route path="leadership" element={<AdminLeadershipPage />} />
                  <Route path="legacy" element={<AdminLegacyPage />} />
                  <Route path="impact" element={<AdminImpactPage />} />
                  <Route path="governance" element={<AdminGovernancePage />} />
                  <Route path="news" element={<AdminNewsPage />} />
                  <Route path="events" element={<AdminEventsPage />} />
                  <Route path="opportunities" element={<AdminOpportunitiesPage />} />
                  <Route path="gallery" element={<AdminGalleryPage />} />
                  <Route path="contact" element={<AdminContactPage />} />
                  <Route path="academics" element={<AdminAcademicsPage />} />
                  <Route path="welfare" element={<AdminWelfarePage />} />
                  <Route element={<ProtectedRoute roles={['admin']} />}>
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                  </Route>
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
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
