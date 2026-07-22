import { lazy } from 'react'
import { Navigate } from 'react-router'
import type { Role } from '@/types'

// Lazy load components for better performance
const Landing = lazy(() => import('@/app/landing/page'))
const Dashboard = lazy(() => import('@/app/dashboard/page'))
const Calendar = lazy(() => import('@/app/calendar/page'))
const Campaigns = lazy(() => import('@/app/campaigns/page'))
const Users = lazy(() => import('@/app/users/page'))
const FAQs = lazy(() => import('@/app/faqs/page'))
const FaqManage = lazy(() => import('@/app/faqs/manage/page'))

// Auth pages
const SignIn = lazy(() => import('@/app/auth/sign-in/page'))
const SignUp = lazy(() => import('@/app/auth/sign-up/page'))
const ForgotPassword = lazy(() => import('@/app/auth/forgot-password/page'))
const AuthCallback = lazy(() => import('@/app/auth/callback/page'))

// Error pages
const Forbidden = lazy(() => import('@/app/errors/forbidden/page'))
const NotFound = lazy(() => import('@/app/errors/not-found/page'))

// Profile
const Profile = lazy(() => import('@/app/profile/page'))

export interface RouteConfig {
  path: string
  element: React.ReactNode
  /** When true, the route is wrapped in ProtectedRoute (requires authentication). */
  protected?: boolean
  /** When set (implies protected), only members with this role may access. */
  requiredRole?: Role
  /** When set (implies protected), only members whose role is one of these may access. */
  requiredRoles?: Role[]
  children?: RouteConfig[]
}

/** The application's route tree, consumed by AppRouter to render the matching Route elements. */
export const routes: RouteConfig[] = [
  // Default route - redirect to dashboard
  // Use relative path "dashboard" instead of "/dashboard" for basename compatibility
  {
    path: "/",
    element: <Navigate to="dashboard" replace />
  },

  // Landing Page (public)
  {
    path: "/landing",
    element: <Landing />
  },

  // Dashboard Routes (internal)
  {
    path: "/dashboard",
    element: <Dashboard />,
    protected: true
  },
  // Legacy path kept as a redirect; the dashboard now lives at /dashboard only.
  {
    path: "/dashboard-2",
    element: <Navigate to="/dashboard" replace />
  },

  // Application Routes (internal)
  {
    path: "/calendar",
    element: <Calendar />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  {
    path: "/campaigns",
    element: <Campaigns />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  {
    path: "/users",
    element: <Users />,
    protected: true,
    requiredRole: "ADMIN"
  },

  // Content Pages (public)
  {
    path: "/faqs",
    element: <FAQs />
  },
  {
    path: "/faqs/manage",
    element: <FaqManage />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },

  // Authentication Routes (public)
  {
    path: "/auth/sign-in",
    element: <SignIn />
  },
  {
    path: "/auth/sign-up",
    element: <SignUp />
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />
  },

  // Error Pages (public)
  {
    path: "/errors/forbidden",
    element: <Forbidden />
  },
  {
    path: "/errors/not-found",
    element: <NotFound />
  },

  // Profile (internal)
  {
    path: "/profile",
    element: <Profile />,
    protected: true
  },

  // Catch-all route for 404
  {
    path: "*",
    element: <NotFound />
  }
]
