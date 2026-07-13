import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'
import { PageLoader } from '@/components/ui'

interface ProtectedRouteProps {
  roles?: UserRole[]
}

/** Redirect unauthenticated users to /login, preserving the attempted URL. */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/** Redirect already-authenticated users away from login/register. */
export function GuestRoute() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
