import { BrowserRouter as Router } from 'react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { AppRouter } from '@/router/app-router'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/sonner'
import { useEffect } from 'react'
import { initGTM } from '@/lib/analytics'

// Get basename from environment (for deployment) or use empty string for development
const basename = import.meta.env.VITE_BASENAME || ''

function App() {
  // Initialize GTM on app load
  useEffect(() => {
    initGTM();
  }, []);

  return (
    <div className="font-sans antialiased" style={{ fontFamily: 'var(--font-inter)' }}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <SidebarConfigProvider>
          <ErrorBoundary>
            <Router basename={basename}>
              <AppRouter />
            </Router>
          </ErrorBoundary>
          <Toaster richColors position="top-center" />
        </SidebarConfigProvider>
      </ThemeProvider>
    </div>
  )
}

export default App
