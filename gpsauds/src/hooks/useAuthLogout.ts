import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** Listens for the auth:logout event fired by the Axios interceptor. */
export function useAuthLogoutListener() {
  const { reset } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => {
      reset()
      navigate('/login', { state: { sessionExpired: true } })
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [reset, navigate])
}
