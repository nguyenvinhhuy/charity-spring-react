import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
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
  // through the axios single-flight refresh (so React StrictMode's double fetch can't trigger
  // two token rotations), restoring the session from the HttpOnly cookie. `enabled: !accessToken`
  // means this never re-runs once a normal sign-in sets the token, matching the one-shot-on-mount
  // behavior the previous effect got by intentionally excluding `accessToken` from its deps.
  const bootstrapQuery = useQuery({
    queryKey: ["auth", "bootstrap"],
    queryFn: getMe,
    enabled: !accessToken,
    retry: false,
    meta: { silent: true }, // "not logged in" is the common case here, not a user-facing error
  })
  const restoring = !accessToken && bootstrapQuery.isPending

  useEffect(() => {
    if (bootstrapQuery.isSuccess) setMember(bootstrapQuery.data)
    if (bootstrapQuery.isError) clear()
  }, [bootstrapQuery.isSuccess, bootstrapQuery.isError, bootstrapQuery.data, setMember, clear])

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
