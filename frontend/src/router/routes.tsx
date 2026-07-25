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
const NewsManage = lazy(() => import('@/app/dashboard/news/manage/page'))
const InquiriesManage = lazy(() => import('@/app/dashboard/inquiries/page'))

// Public content pages (Phase 2)
const PublicCampaigns = lazy(() => import('@/app/public/campaigns/page'))
const PublicCampaignDetail = lazy(() => import('@/app/public/campaigns/detail'))
const PublicNews = lazy(() => import('@/app/public/news/page'))
const PublicNewsDetail = lazy(() => import('@/app/public/news/detail'))
const About = lazy(() => import('@/app/about/page'))
const Contact = lazy(() => import('@/app/contact/page'))

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
  // Public home — shown to everyone (anonymous, MEMBER, and staff alike). Staff
  // are only redirected to /dashboard right after logging in (see login-form.tsx/
  // signup-form.tsx); visiting "/" afterwards always shows the public site, so the
  // sidebar's "Home" preview link actually previews it instead of bouncing back.
  {
    path: "/",
    element: <Landing />
  },

  // Legacy standalone path; the home page now lives at "/" only.
  {
    path: "/landing",
    element: <Navigate to="/" replace />
  },

  // Public content pages (Phase 2)
  {
    path: "/campaigns",
    element: <PublicCampaigns />
  },
  {
    path: "/campaigns/:slug",
    element: <PublicCampaignDetail />
  },
  {
    path: "/news",
    element: <PublicNews />
  },
  {
    path: "/news/:slug",
    element: <PublicNewsDetail />
  },
  {
    path: "/about",
    element: <About />
  },
  {
    path: "/contact",
    element: <Contact />
  },

  // Dashboard Routes (staff only: ADMIN/CONTRIBUTOR)
  {
    path: "/dashboard",
    element: <Dashboard />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  // Legacy path kept as a redirect; the dashboard now lives at /dashboard only.
  {
    path: "/dashboard-2",
    element: <Navigate to="/dashboard" replace />
  },

  // Application Routes (internal, namespaced under /dashboard)
  {
    path: "/dashboard/calendar",
    element: <Calendar />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  {
    path: "/dashboard/campaigns",
    element: <Campaigns />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  {
    path: "/dashboard/users",
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
    path: "/dashboard/faqs",
    element: <FaqManage />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  {
    path: "/dashboard/news",
    element: <NewsManage />,
    requiredRoles: ["ADMIN", "CONTRIBUTOR"]
  },
  {
    path: "/dashboard/inquiries",
    element: <InquiriesManage />,
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

  // Profile (public — shared by every authenticated role)
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
