import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Building, Loader2, ArrowRight, Check, WifiOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../lib/utils'
import { useAuthStore, useWorkspaceStore } from '../../store'
import { authApi, warmupBackend, getBackendStatus } from '../../services/api'
import toast from 'react-hot-toast'

// ─── Google OAuth helper ────────────────────────────────────────────────────
function GoogleButton({ isLoading, label = 'Continue with Google' }: { isLoading: boolean; label?: string }) {
  const handleGoogleSignUp = () => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
      import.meta.env.VITE_GOOGLE_CLIENTID ||
      ''
    if (!clientId) {
      toast.error(
        'Google Sign-In requires a Google Client ID in frontend/.env (VITE_GOOGLE_CLIENT_ID).',
        { duration: 5000, id: 'google-no-client' }
      )
      return
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const state = btoa(JSON.stringify({ mode: 'register', ts: Date.now() }))
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
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignUp}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
    >
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

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
]

export function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'ready' | 'offline'>('checking')
  const { login } = useAuthStore()
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceStore()
  const navigate = useNavigate()

  // Warm up backend when register page loads
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const allRequirementsMet = PASSWORD_REQUIREMENTS.every((req) => req.test(formData.password))
    if (!allRequirementsMet) {
      toast.error('Please meet all password requirements')
      return
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions')
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
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      
      const { user, accessToken, workspace, workspaces } = response.data
      
      // Log user in automatically after registration
      login(user, accessToken)
      
      // Set workspace
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        setWorkspaces(workspaces)
        setCurrentWorkspace(workspaces[0])
      } else if (workspace) {
        setWorkspaces([workspace])
        setCurrentWorkspace(workspace)
      }
      
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error)
      const msg = error.message || 'Failed to create account'
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create an account</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Start managing your social media today
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Full Name *
          </label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Smith"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email Address *
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Company (Optional)
          </label>
          <div className="relative mt-1.5">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Acme Inc."
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password *
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
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
          {/* Password requirements */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(formData.password)
                return (
                  <div key={req.id} className="flex items-center gap-2 text-xs">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center',
                        met
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={met ? 'text-emerald-600' : 'text-slate-500'}>{req.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm Password *
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="••••••••"
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={cn(
              'w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors',
              agreedToTerms
                ? 'bg-indigo-600 border-indigo-600'
                : 'border-slate-300 dark:border-slate-600'
            )}
          >
            {agreedToTerms && <Check className="w-3 h-3 text-white" />}
          </button>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            I agree to the{' '}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
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
          <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">Or sign up with</span>
        </div>
      </div>

      {/* Google Button (full width) */}
      <GoogleButton isLoading={isLoading} label="Sign up with Google" />

      {/* GitHub */}
      <div className="mt-3">
        <Button variant="outline" type="button" disabled={isLoading} className="w-full gap-2">
          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign up with GitHub
        </Button>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
