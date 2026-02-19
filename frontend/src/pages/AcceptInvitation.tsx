import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, LogIn, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuthStore, useWorkspaceStore } from '../store'
import { workspacesApi } from '../services/api'
import { request } from '../services/api'

// Accept invitation API call
async function acceptInvitationApi(token: string) {
  return request<{ success: boolean; data: { member: any } }>({
    method: 'POST',
    url: `/workspaces/invitations/${token}/accept`,
  })
}

type InviteStatus = 'loading' | 'success' | 'error' | 'needsLogin' | 'needsRegister'

export function AcceptInvitation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceStore()

  const [status, setStatus] = useState<InviteStatus>('loading')
  const [message, setMessage] = useState('')
  const acceptedRef = useRef(false)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    // If not authenticated, user needs to login first
    if (!isAuthenticated) {
      // Save the invite token so we can redirect back after login
      sessionStorage.setItem('pendingInviteToken', token || '')
      setStatus('needsLogin')
      setMessage('You need to sign in to accept this invitation.')
      return
    }

    // Already authenticated — accept the invitation
    if (acceptedRef.current) return
    acceptedRef.current = true

    async function doAccept() {
      try {
        setStatus('loading')
        const res = await acceptInvitationApi(token!)

        const member = res?.data?.member || res?.data
        const workspace = member?.workspace

        if (workspace) {
          // Refresh the workspace list and switch to new workspace
          try {
            const wsRes = await workspacesApi.getAll()
            const raw = wsRes as any
            const allWorkspaces = raw?.data?.workspaces || raw?.workspaces || (Array.isArray(raw?.data) ? raw.data : [])
            if (Array.isArray(allWorkspaces) && allWorkspaces.length > 0) {
              setWorkspaces(allWorkspaces)
            }
          } catch {
            // Not critical — workspace list will refresh on next load
          }
          setCurrentWorkspace(workspace)
        }

        setStatus('success')
        setMessage(workspace?.name
          ? `You've joined "${workspace.name}" successfully!`
          : 'Invitation accepted successfully!')

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/team', { replace: true })
        }, 2500)
      } catch (err: any) {
        setStatus('error')
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to accept invitation'

        // Check specific error cases
        if (errMsg.includes('different email')) {
          setMessage('This invitation was sent to a different email address. Please sign in with the correct account.')
        } else if (errMsg.includes('already accepted')) {
          setMessage('This invitation has already been accepted.')
          // Still redirect to team page
          setTimeout(() => navigate('/team', { replace: true }), 2500)
        } else if (errMsg.includes('expired')) {
          setMessage('This invitation has expired. Please ask the workspace owner to send a new one.')
        } else if (errMsg.includes('Invalid')) {
          setMessage('This invitation link is invalid or has been revoked.')
        } else {
          setMessage(errMsg)
        }
      }
    }

    doAccept()
  }, [token, isAuthenticated, authLoading, navigate, setCurrentWorkspace, setWorkspaces])

  // Also check for pending invite after login redirect
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const pending = sessionStorage.getItem('pendingInviteToken')
      if (pending && pending === token) {
        sessionStorage.removeItem('pendingInviteToken')
        // The main effect will handle acceptance
      }
    }
  }, [isAuthenticated, authLoading, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-br from-indigo-500 to-purple-600 px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Team Invitation</h1>
            <p className="text-indigo-100 mt-1 text-sm">SocialHub Workspace</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Accepting invitation...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to the team!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">{message}</p>
                </div>
                <p className="text-sm text-slate-400">Redirecting to your team page...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Accept</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">{message}</p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  <Button onClick={() => navigate('/team')}>
                    View Team
                  </Button>
                </div>
              </div>
            )}

            {status === 'needsLogin' && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                  <LogIn className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">{message}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                    After signing in, you'll be redirected back to accept the invitation.
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Link to="/auth/login">
                    <Button>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button variant="outline">Create Account</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
