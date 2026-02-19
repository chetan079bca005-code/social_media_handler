import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore, useWorkspaceStore } from '../../store'
import { authApi, warmupBackend, getBackendStatus } from '../../services/api'
import toast from 'react-hot-toast'

// ─── Google OAuth helper (demo / real Google Identity flow) ─────────────────
function buildGoogleOAuthUrl(mode: 'login' | 'register' = 'login') {
  // Uses Google's real OAuth 2.0 endpoint with a demo/test client
  // In production set VITE_GOOGLE_CLIENT_ID in frontend/.env
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_CLIENTID ||
    ''
  const redirectUri = `${window.location.origin}/auth/google/callback`
  const state = btoa(JSON.stringify({ mode, ts: Date.now() }))
  if (!clientId) return null
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: crypto.randomUUID(),
    response_mode: 'fragment',
    prompt: 'select_account',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

function GoogleButton({ isLoading, label = 'Continue with Google' }: { isLoading: boolean; label?: string }) {
  const handleGoogleLogin = () => {
    const url = buildGoogleOAuthUrl('login')
    if (!url) {
      // No client ID configured — show informative toast
      toast.error(
        'Google Sign-In requires a Google Client ID in frontend/.env (VITE_GOOGLE_CLIENT_ID).',
        { duration: 5000, id: 'google-no-client' }
      )
      return
    }
    // Open in same window (standard OAuth flow)
    window.location.href = url
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
    >
      {/* Official Google G logo */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2045c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'ready' | 'offline'>('checking')
  const { login } = useAuthStore()
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceStore()
  const navigate = useNavigate()

  // Warm up backend when login page loads
  useEffect(() => {
    let mounted = true
    const checkServer = async () => {
      const status = getBackendStatus()
      if (status === 'ready') {
        if (mounted) setServerStatus('ready')
        return
      }
      if (mounted) setServerStatus('checking')
      const ok = await warmupBackend()
      if (mounted) setServerStatus(ok ? 'ready' : 'offline')
    }
    checkServer()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    // If server was offline, try warming up first
    if (serverStatus !== 'ready') {
      toast.loading('Connecting to server...', { id: 'server-warmup' })
      const ok = await warmupBackend()
      toast.dismiss('server-warmup')
      if (!ok) {
        toast.error('Server is unavailable. Please make sure the backend is running and try again.')
        setIsLoading(false)
        return
      }
      setServerStatus('ready')
    }

    try {
      const response = await authApi.login(email, password)
      const { user, accessToken, workspaces } = response.data
      
      // Set user and token in auth store
      login(user, accessToken)
      
      // Set workspace if user has any
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        setWorkspaces(workspaces)
        setCurrentWorkspace(workspaces[0])
      }
      
      toast.success('Welcome back!')
      
      // Check for pending invitation redirect
      const pendingInvite = sessionStorage.getItem('pendingInviteToken')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteToken')
        navigate(`/invite/${pendingInvite}`, { replace: true })
      } else {
        navigate('/dashboard')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const msg = error.message || 'Invalid email or password'
      
      // If it was a timeout/network error, mark server as potentially offline
      if (msg.includes('taking too long') || msg.includes('Unable to reach') || msg.includes('Connection failed')) {
        setServerStatus('offline')
      }
      
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">SM</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Sign in to your account to continue
        </p>
      </div>

      {/* Server status banner */}
      {serverStatus === 'checking' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Connecting to server...</span>
        </div>
      )}
      {serverStatus === 'offline' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Server is unreachable. Check if the backend is running.</span>
          <button
            type="button"
            onClick={async () => {
              setServerStatus('checking')
              const ok = await warmupBackend()
              setServerStatus(ok ? 'ready' : 'offline')
            }}
            className="ml-auto text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      {serverStatus === 'ready' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-300">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Server connected</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">Or continue with</span>
        </div>
      </div>

      {/* Google Button (full width) */}
      <GoogleButton isLoading={isLoading} />

      {/* Sign Up Link */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Create one now
        </Link>
      </p>
    </motion.div>
  )
}
