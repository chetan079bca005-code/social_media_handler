import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuthStore, useWorkspaceStore } from '../../store'

type GoogleJwtPayload = {
  sub?: string
  email?: string
  name?: string
  given_name?: string
  family_name?: string
}

function parseStateMode(rawState: string | null): 'login' | 'register' {
  if (!rawState) return 'login'
  try {
    const decoded = atob(rawState)
    const parsed = JSON.parse(decoded)
    return parsed?.mode === 'register' ? 'register' : 'login'
  } catch {
    return 'login'
  }
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized
  return atob(padded)
}

function parseIdToken(idToken: string): GoogleJwtPayload | null {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return payload
  } catch {
    return null
  }
}

export function GoogleCallback() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceStore()
  const didRun = useRef(false)

  useEffect(() => {
    // Prevent double-run in React StrictMode
    if (didRun.current) return
    didRun.current = true

    const completeGoogleAuth = async () => {
      try {
        // Google returns params in the URL fragment (#) when response_mode=fragment
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const query = new URLSearchParams(window.location.search)

        const idToken = hash.get('id_token') || query.get('id_token')
        const state = query.get('state') || hash.get('state')
        const mode = parseStateMode(state)

        if (!idToken) {
          toast.error('Google login failed: no identity token returned.')
          navigate('/auth/login', { replace: true })
          return
        }

        const profile = parseIdToken(idToken)
        const email = profile?.email?.trim().toLowerCase()
        const sub = profile?.sub || ''
        const name = profile?.name || [profile?.given_name, profile?.family_name].filter(Boolean).join(' ') || 'Google User'

        if (!email || !sub) {
          toast.error('Google login failed: could not read your Google profile.')
          navigate('/auth/login', { replace: true })
          return
        }

        // Call dedicated backend Google auth endpoint
        const response = await authApi.googleAuth({ email, name, googleSub: sub })

        if (!response?.data) {
          toast.error('Google authentication failed.')
          navigate('/auth/login', { replace: true })
          return
        }

        const { user, accessToken, workspaces, workspace } = response.data

        // Set auth state
        login(user, accessToken)

        // Set workspaces
        if (Array.isArray(workspaces) && workspaces.length > 0) {
          setWorkspaces(workspaces)
          setCurrentWorkspace(workspaces[0])
        } else if (workspace) {
          setWorkspaces([workspace])
          setCurrentWorkspace(workspace)
        }

        toast.success(mode === 'register' ? 'Account created with Google!' : 'Signed in with Google!')
        navigate('/dashboard', { replace: true })
      } catch (error: any) {
        console.error('Google auth error:', error)
        toast.error(error?.message || 'Google authentication failed. Please try again.')
        navigate('/auth/login', { replace: true })
      }
    }

    completeGoogleAuth()
  }, [navigate, login, setCurrentWorkspace, setWorkspaces])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Completing Google sign in…</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Please wait while we securely finish authentication.</p>
        </div>
      </div>
    </div>
  )
}
