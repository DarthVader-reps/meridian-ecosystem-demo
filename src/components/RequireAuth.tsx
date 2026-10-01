import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LoadingState } from './ui'
import { useAuth } from '../store/auth'

/** Redirects to /login when there is no signed-in user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Checking session" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
