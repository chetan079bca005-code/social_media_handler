import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore, useWorkspaceStore } from '../../store'
import { authApi, warmupBackend, getBackendStatus } from '../../services/api'
import toast from 'react-hot-toast'

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
      navigate('/dashboard')
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
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">Or continue with</span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" disabled={isLoading}>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button variant="outline" type="button" disabled={isLoading}>
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </Button>
      </div>

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
