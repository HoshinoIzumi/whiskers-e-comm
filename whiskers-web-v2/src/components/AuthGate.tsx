import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { AuthRole } from '../lib/api'

export default function AuthGate({
  children,
  roles,
}: {
  children: ReactNode
  roles?: AuthRole[]
}) {
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // App 层会负责 hydrate user；这里兜底等待一下。
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-stone-600 dark:text-stone-400">
        Loading…
      </div>
    )
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

