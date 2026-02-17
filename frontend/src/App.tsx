import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { MainLayout, AuthLayout } from './components/layout'
import {
  Dashboard,
  CreatePost,
  ContentCalendar,
  Analytics,
  SocialAccounts,
  AIStudio,
  MediaLibrary,
  Templates,
  Team,
  SettingsPage,
  Scheduled,
  Published,
  Inbox,
  Hashtags,
  ManageWorkspaces,
  DesignStudio,
  Login,
  Register,
  ForgotPassword,
} from './pages'
import { useAuthStore, useUIStore } from './store'
import { authApi, warmupBackend } from './services/api'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return null
  }
  
  // Only allow access when fully authenticated (token verified by initializeAuth)
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }
  
  return <>{children}</>
}

// Public Route wrapper (redirects if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return null
  }
  
  // Only redirect when fully authenticated, not just because a stale token exists
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { token, login, logout, setLoading } = useAuthStore()
  const { theme } = useUIStore()

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove both classes first
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(systemPrefersDark ? 'dark' : 'light')
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark')
        root.classList.add(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      // Warm up backend connection (fires DB ping to prevent cold-start timeout on first real request)
      warmupBackend()

      if (!token) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      // ALWAYS verify the token with the server before granting access.
      // This prevents stale/expired tokens from bypassing auth.
      try {
        const response = await authApi.me()
        if (isMounted) {
          // Token is valid — set user + isAuthenticated
          login(response.data.user, token)
        }
      } catch (error) {
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [token, login, logout, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route index element={<Navigate to="/auth/login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreatePost />} />
            <Route path="edit/:postId" element={<CreatePost />} />
            <Route path="calendar" element={<ContentCalendar />} />
            <Route path="scheduled" element={<Scheduled />} />
            <Route path="published" element={<Published />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="accounts" element={<SocialAccounts />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="ai-studio" element={<AIStudio />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="templates" element={<Templates />} />
            <Route path="hashtags" element={<Hashtags />} />
            <Route path="design-studio" element={<DesignStudio />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/workspaces" element={<ManageWorkspaces />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
