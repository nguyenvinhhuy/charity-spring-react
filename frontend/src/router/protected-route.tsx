import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router"
import { getMe } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import type { Role } from "@/types/common"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  /** When set, only members with this role may access; others get the Forbidden page. */
  requiredRole?: Role
  /** When set, only members whose role is one of these may access; others get Forbidden. */
  requiredRoles?: Role[]
}

/**
 * Guards its children behind authentication and an optional role check, redirecting otherwise.
 *
 * @param children the protected content to render once authorized
 * @param requiredRole when set, only members with this role may access; others see the Forbidden page
 * @param requiredRoles when set, only members whose role is one of these may access; others see the Forbidden page
 */
export function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const member = useAuthStore((s) => s.member)
  const setMember = useAuthStore((s) => s.setMember)
  const clear = useAuthStore((s) => s.clear)
  const location = useLocation()

  // The access token lives in memory only. On a fresh load, call getMe(): its 401 goes
  // through the axios single-flight refresh (so React StrictMode's double effect can't
  // trigger two token rotations), restoring the session from the HttpOnly cookie.
  const [restoring, setRestoring] = useState(!accessToken)

  useEffect(() => {
    if (accessToken) return
    let active = true
    getMe()
      .then((m) => {
        if (active) setMember(m)
      })
      .catch(() => {
        if (active) clear()
      })
      .finally(() => {
        if (active) setRestoring(false)
      })
    return () => {
      active = false
    }
    // Intentionally excludes accessToken: this must run once on mount only, not whenever
    // accessToken later changes (e.g. after a normal sign-in), or it would re-trigger restoration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear, setMember])

  if (restoring) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/auth/sign-in" replace state={{ from: location.pathname }} />
  }

  // Build the set of allowed roles from either prop; an empty set means "any authenticated".
  const allowedRoles = requiredRoles ?? (requiredRole ? [requiredRole] : [])
  if (allowedRoles.length > 0 && (!member || !allowedRoles.includes(member.role))) {
    return <Navigate to="/errors/forbidden" replace />
  }

  return <>{children}</>
}
