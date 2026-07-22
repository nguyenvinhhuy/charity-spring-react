"use client"

import { Suspense } from 'react'
import { Routes, Route } from 'react-router'
import { routes, type RouteConfig } from '@/router/routes'
import { ProtectedRoute } from '@/router/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function renderRoutes(routeConfigs: RouteConfig[]) {
  return routeConfigs.map((route, index) => {
    const content = (
      <Suspense fallback={<LoadingSpinner />}>
        {route.element}
      </Suspense>
    )
    return (
      <Route
        key={route.path + index}
        path={route.path}
        element={
          route.protected || route.requiredRole || route.requiredRoles ? (
            <ProtectedRoute
              requiredRole={route.requiredRole}
              requiredRoles={route.requiredRoles}
            >
              {content}
            </ProtectedRoute>
          ) : (
            content
          )
        }
      >
        {route.children && renderRoutes(route.children)}
      </Route>
    )
  })
}

/** Renders the app's route tree, wrapping protected or role-gated routes in ProtectedRoute inside Suspense. */
export function AppRouter() {
  return (
    <Routes>
      {renderRoutes(routes)}
    </Routes>
  )
}
