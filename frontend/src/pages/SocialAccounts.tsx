import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  TrendingUp,
  Loader2,
  Shield,
  Wifi,
  WifiOff,
  Settings,
  BarChart2,
  Clock,
  ArrowRight,
  X,
  Info,
  Lock,
  Globe,
  Zap,
  Eye,
  ChevronRight,
  Link,
  Award,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import { getPlatformColor, formatNumber, PLATFORMS } from '../lib/utils'
import { getPlatformIcon } from '../components/ui/PlatformIcons'
import { socialAccountsApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import { useDataCache, invalidateCache } from '../lib/useDataCache'
import toast from 'react-hot-toast'

// ─── Platform metadata ───────────────────────────────────────────────────────

const PLATFORM_META: Record<string, {
  name: string
  tagline: string
  description: string
  authType: 'oauth2' | 'api_key'
  oauthScopes: string[]
  requiredAccountType: string
  permissions: { label: string; icon: string }[]
  steps: string[]
  helpUrl: string
  docsUrl: string
  apiNote?: string
  gradient: string
}> = {
  facebook: {
    name: 'Facebook',
    tagline: 'Pages & Groups',
    description: 'Connect your Facebook Page to publish posts, stories, manage comments, and view audience analytics.',
    authType: 'oauth2',
    oauthScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'publish_video'],
    requiredAccountType: 'Facebook Page (not personal profile)',
    permissions: [
      { label: 'Read and publish posts', icon: '✍️' },
      { label: 'View page insights', icon: '📊' },
      { label: 'Manage comments', icon: '💬' },
      { label: 'Schedule content', icon: '📅' },
    ],
    steps: [
      "Click \"Authorize with Facebook\" below",
      'Log in to Facebook in the popup window',
      'Select the Page(s) you want to connect',
      'Grant the requested permissions',
      "You'll be redirected back automatically",
    ],
    helpUrl: 'https://www.facebook.com/help/pages',
    docsUrl: 'https://developers.facebook.com/docs/pages',
    gradient: 'from-blue-600 to-blue-700',
  },
  instagram: {
    name: 'Instagram',
    tagline: 'Business & Creator',
    description: 'Connect your Instagram Business or Creator account to schedule posts, reels, stories, and track insights.',
    authType: 'oauth2',
    oauthScopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
    requiredAccountType: 'Instagram Business or Creator account',
    permissions: [
      { label: 'Publish feed posts & reels', icon: '📸' },
      { label: 'Post & view stories', icon: '🎬' },
      { label: 'View insights & analytics', icon: '📈' },
      { label: 'Manage scheduled content', icon: '⏰' },
    ],
    steps: [
      "Click \"Authorize with Instagram\" below",
      'Ensure your account is Business or Creator type',
      'Log in and grant permissions in the popup',
      'Select your Instagram account',
      'Connection completes automatically',
    ],
    helpUrl: 'https://help.instagram.com/502981923235522',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    apiNote: 'Requires Instagram account linked to a Facebook Page',
    gradient: 'from-pink-500 to-orange-400',
  },
  twitter: {
    name: 'Twitter / X',
    tagline: 'Tweets & Threads',
    description: 'Connect your X account to post tweets, schedule threads, monitor engagement, and manage replies.',
    authType: 'oauth2',
    oauthScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    requiredAccountType: 'Any Twitter / X account',
    permissions: [
      { label: 'Post and schedule tweets', icon: '🐦' },
      { label: 'Create tweet threads', icon: '🧵' },
      { label: 'View engagement metrics', icon: '📊' },
      { label: 'Read timeline & mentions', icon: '🔔' },
    ],
    steps: [
      'Click "Authorize with X (Twitter)" below',
      'Log in to your Twitter / X account',
      'Review and approve permissions',
      "You'll be redirected back automatically",
    ],
    helpUrl: 'https://help.twitter.com',
    docsUrl: 'https://developer.twitter.com/en/docs',
    gradient: 'from-gray-800 to-black',
  },
  linkedin: {
    name: 'LinkedIn',
    tagline: 'Professional Network',
    description: 'Connect your LinkedIn profile or company page to publish posts, articles, and track professional engagement.',
    authType: 'oauth2',
    oauthScopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'rw_organization_admin'],
    requiredAccountType: 'LinkedIn Personal or Company Page',
    permissions: [
      { label: 'Publish posts & articles', icon: '📝' },
      { label: 'Manage company page', icon: '🏢' },
      { label: 'View analytics', icon: '📊' },
      { label: 'Share documents & media', icon: '📎' },
    ],
    steps: [
      "Click \"Authorize with LinkedIn\" below",
      'Sign in to your LinkedIn account',
      'Approve the permissions request',
      'Select Personal or Company Page',
      'Connection confirmed instantly',
    ],
    helpUrl: 'https://www.linkedin.com/help',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin',
    gradient: 'from-blue-700 to-blue-800',
  },
  tiktok: {
    name: 'TikTok',
    tagline: 'Short-form Video',
    description: 'Connect your TikTok Business account to upload videos, track performance, and grow your audience.',
    authType: 'oauth2',
    oauthScopes: ['user.info.basic', 'video.upload', 'video.list'],
    requiredAccountType: 'TikTok Business or Creator account',
    permissions: [
      { label: 'Upload & publish videos', icon: '🎵' },
      { label: 'View video performance', icon: '📈' },
      { label: 'Access profile info', icon: '👤' },
      { label: 'Manage content library', icon: '🎬' },
    ],
    steps: [
      "Click \"Authorize with TikTok\" below",
      'Switch to a Business account first if needed',
      'Log in and scan QR code if prompted',
      'Grant the required permissions',
      'Account syncs automatically',
    ],
    helpUrl: 'https://support.tiktok.com',
    docsUrl: 'https://developers.tiktok.com',
    apiNote: 'Personal accounts have limited posting capabilities',
    gradient: 'from-black to-gray-900',
  },
  youtube: {
    name: 'YouTube',
    tagline: 'Video Publishing',
    description: 'Connect your YouTube channel to upload videos, manage shorts, publish community posts, and track analytics.',
    authType: 'oauth2',
    oauthScopes: ['youtube.upload', 'youtube.readonly', 'youtube.force-ssl'],
    requiredAccountType: 'YouTube Channel (linked to Google account)',
    permissions: [
      { label: 'Upload & publish videos', icon: '▶️' },
      { label: 'Post community updates', icon: '📢' },
      { label: 'View channel analytics', icon: '📊' },
      { label: 'Manage video metadata', icon: '✏️' },
    ],
    steps: [
      "Click \"Authorize with Google\" below",
      'Sign in with your Google account',
      'Select the YouTube channel to connect',
      'Review and grant permissions',
      'Channel is linked immediately',
    ],
    helpUrl: 'https://support.google.com/youtube',
    docsUrl: 'https://developers.google.com/youtube/v3',
    gradient: 'from-red-600 to-red-700',
  },
  pinterest: {
    name: 'Pinterest',
    tagline: 'Visual Discovery',
    description: 'Connect your Pinterest Business account to create pins, manage boards, and track audience engagement.',
    authType: 'oauth2',
    oauthScopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
    requiredAccountType: 'Pinterest Business account',
    permissions: [
      { label: 'Create & manage pins', icon: '📌' },
      { label: 'Create & organize boards', icon: '🗂️' },
      { label: 'View analytics', icon: '📊' },
      { label: 'Manage shopping catalog', icon: '🛒' },
    ],
    steps: [
      "Click \"Authorize with Pinterest\" below",
      'Log in to your Pinterest Business account',
      'Allow access to your boards and pins',
      'Choose boards to sync',
      'Pins will be managed from here',
    ],
    helpUrl: 'https://help.pinterest.com',
    docsUrl: 'https://developers.pinterest.com',
    gradient: 'from-red-700 to-red-800',
  },
  threads: {
    name: 'Threads',
    tagline: 'Text-based Conversations',
    description: 'Connect your Threads account to post updates, manage replies, and track engagement with your audience.',
    authType: 'oauth2',
    oauthScopes: ['threads_basic', 'threads_content_publish', 'threads_manage_replies'],
    requiredAccountType: 'Threads account (linked to Instagram)',
    permissions: [
      { label: 'Publish threads & replies', icon: '✍️' },
      { label: 'View engagement metrics', icon: '📊' },
      { label: 'Manage conversations', icon: '💬' },
      { label: 'Schedule content', icon: '📅' },
    ],
    steps: [
      "Click \"Authorize with Threads\" below",
      'Log in with your Threads / Instagram account',
      'Approve the permissions',
      'Account connects automatically',
    ],
    helpUrl: 'https://help.instagram.com/threads',
    docsUrl: 'https://developers.facebook.com/docs/threads',
    apiNote: 'Requires an existing Instagram account',
    gradient: 'from-gray-900 to-black',
  },
}

// ─── OAuth Simulation Popup ──────────────────────────────────────────────────

interface OAuthWindowProps {
  platform: string
  onSuccess: (data: { accountName: string; username: string; followers: number }) => void
  onCancel: () => void
}

function OAuthWindow({ platform, onSuccess, onCancel }: OAuthWindowProps) {
  const [step, setStep] = useState<'login' | 'forgot' | 'forgot_sent' | 'register' | 'permissions' | 'authorizing' | 'success'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [progress, setProgress] = useState(0)
  // forgot password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  // register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regError, setRegError] = useState('')
  const meta = PLATFORM_META[platform]
  const color = getPlatformColor(platform)

  const demoData: Record<string, { accountName: string; username: string; followers: number }> = {
    facebook: { accountName: 'My Business Page', username: 'mybizpage', followers: 12840 },
    instagram: { accountName: 'Creative Studio', username: '@creativestudio', followers: 34200 },
    twitter: { accountName: 'TechBrand Official', username: '@techbrand', followers: 8900 },
    linkedin: { accountName: 'Acme Corp', username: 'acme-corp', followers: 5600 },
    tiktok: { accountName: 'BrandChannel', username: '@brandchannel', followers: 87000 },
    youtube: { accountName: 'Our YouTube Channel', username: '@OurYTChannel', followers: 22300 },
    pinterest: { accountName: 'Design Boards', username: 'designboards', followers: 4100 },
    threads: { accountName: 'Our Threads', username: '@ourthreads', followers: 2700 },
  }

  const handleLogin = () => {
    if (!email || !password) { setLoginError('Please enter your email and password'); return }
    if (!email.includes('@')) { setLoginError('Please enter a valid email address'); return }
    setLoginError('')
    setStep('permissions')
  }

  const handleForgotSubmit = () => {
    if (!forgotEmail) { setForgotError('Please enter your email address'); return }
    if (!forgotEmail.includes('@')) { setForgotError('Please enter a valid email address'); return }
    setForgotError('')
    setForgotLoading(true)
    // Simulate sending reset email
    setTimeout(() => {
      setForgotLoading(false)
      setStep('forgot_sent')
    }, 1400)
  }

  const handleRegisterSubmit = () => {
    if (!regName.trim()) { setRegError('Please enter your full name'); return }
    if (!regEmail || !regEmail.includes('@')) { setRegError('Please enter a valid email address'); return }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters'); return }
    setRegError('')
    // Pre-fill the login form and proceed to permissions
    setEmail(regEmail)
    setPassword(regPassword)
    setStep('permissions')
  }

  const handleAuthorize = () => {
    setStep('authorizing')
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 22 + 6
      setProgress(Math.min(p, 95))
      if (p >= 95) {
        clearInterval(interval)
        setTimeout(() => {
          setProgress(100)
          setStep('success')
          setTimeout(() => {
            onSuccess(demoData[platform] || {
              accountName: `${meta?.name} Account`,
              username: `@user_${platform}`,
              followers: Math.floor(Math.random() * 50000) + 1000,
            })
          }, 900)
        }, 400)
      }
    }, 120)
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className={`bg-linear-to-r ${meta?.gradient || 'from-indigo-600 to-purple-600'} p-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              {getPlatformIcon(platform, 22)}
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">Sign in with</p>
              <h3 className="text-white font-bold text-lg leading-tight">{meta?.name}</h3>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* SSL bar */}
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 flex items-center gap-2">
          <Lock className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
          <span className="text-xs text-green-700 dark:text-green-400 font-medium truncate">
            Secure OAuth 2.0 · accounts.{platform}.com
          </span>
        </div>

        <div className="p-6">
          {/* STEP: Login */}
          {step === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your {meta?.name} credentials to authorize access.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Email / Username</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              {loginError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {loginError}
                </p>
              )}
              <button
                onClick={handleLogin}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
              >
                Log in to {meta?.name}
              </button>
              <p className="text-center text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotError(''); setStep('forgot') }}
                  className="text-indigo-500 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => { setRegName(''); setRegEmail(email); setRegPassword(''); setRegError(''); setStep('register') }}
                  className="text-indigo-500 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Create account
                </button>
              </p>
            </motion.div>
          )}

          {/* STEP: Forgot Password */}
          {step === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">Reset your password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter the email address associated with your {meta?.name} account and we'll send you a reset link.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Email address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  onKeyDown={e => e.key === 'Enter' && handleForgotSubmit()}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              {forgotError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {forgotError}
                </p>
              )}
              <button
                onClick={handleForgotSubmit}
                disabled={forgotLoading}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
              >
                {forgotLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send Reset Link'}
              </button>
              <button
                onClick={() => setStep('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                ← Back to sign in
              </button>
            </motion.div>
          )}

          {/* STEP: Forgot Sent */}
          {step === 'forgot_sent' && (
            <motion.div key="forgot_sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Check your email</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  We've sent a password reset link to<br />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{forgotEmail}</span>
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Didn't receive it?{' '}
                <button onClick={() => setStep('forgot')} className="text-indigo-500 hover:underline">Resend</button>
              </p>
              <button
                onClick={() => setStep('login')}
                className="w-full py-2 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
              >
                Back to Sign In
              </button>
            </motion.div>
          )}

          {/* STEP: Create Account */}
          {step === 'register' && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">Create a {meta?.name} account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You'll be redirected to {meta?.name} to complete registration.
                </p>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              {regError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {regError}
                </p>
              )}
              <button
                onClick={handleRegisterSubmit}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
              >
                Create Account
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span>or</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
              <a
                href={`https://www.${platform === 'twitter' ? 'x' : platform}.com/signup`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Sign up on {meta?.name}
              </a>
              <button
                onClick={() => setStep('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                ← Back to sign in
              </button>
            </motion.div>
          )}

          {/* STEP: Permissions */}
          {step === 'permissions' && (
            <motion.div key="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                Logged in as <span className="font-semibold truncate">{email}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Permissions Requested</p>
                <div className="space-y-2.5">
                  {meta?.permissions.map((perm, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-base w-5 text-center shrink-0">{perm.icon}</span>
                      <span>{perm.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  We never store your {meta?.name} password. You can revoke access anytime from your {meta?.name} settings.
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Deny
                </button>
                <button
                  onClick={handleAuthorize}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                >
                  Allow Access
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: Authorizing */}
          {step === 'authorizing' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 py-2">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}18` }}>
                  {getPlatformIcon(platform, 32)}
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">Authorizing…</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Securely connecting your account</p>
              </div>
              <div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-right mt-1">{Math.round(progress)}%</p>
              </div>
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />Verifying credentials</div>
                {progress > 35 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />Validating permissions</motion.div>}
                {progress > 60 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />Fetching account data</motion.div>}
                {progress > 85 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    {progress < 100 ? <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    Finalizing connection
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-lg">Connected!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your {meta?.name} account has been linked successfully.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Connected Account Card ──────────────────────────────────────────────────

interface AccountCardProps {
  account: any
  onDisconnect: (id: string) => void
  onRefresh: (id: string) => void
  onReconnect: (platform: string) => void
}

function AccountCard({ account, onDisconnect, onRefresh, onReconnect }: AccountCardProps) {
  const color = getPlatformColor(account.platform)
  const meta = PLATFORM_META[account.platform]
  const isError = !!account.error
  const isActive = account.isActive && !isError

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <Card className={`overflow-hidden hover:shadow-md transition-all ${isError ? 'border-red-200 dark:border-red-800' : ''}`}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm"
                  style={{ backgroundColor: `${color}18` }}
                >
                  {getPlatformIcon(account.platform, 28)}
                </div>
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
                  style={{ backgroundColor: isActive ? '#22c55e' : isError ? '#ef4444' : '#f59e0b' }}
                >
                  {isActive
                    ? <Wifi className="w-2.5 h-2.5 text-white" />
                    : isError
                    ? <WifiOff className="w-2.5 h-2.5 text-white" />
                    : <AlertCircle className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-tight truncate">
                  {account.accountName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{account.accountUsername || meta?.tagline}</p>
                <div className="mt-1.5">
                  {isActive
                    ? <Badge variant="success" size="sm" className="gap-1 text-[10px]"><CheckCircle2 className="w-2.5 h-2.5" />Connected</Badge>
                    : isError
                    ? <Badge variant="destructive" size="sm" className="gap-1 text-[10px]"><XCircle className="w-2.5 h-2.5" />Error</Badge>
                    : <Badge variant="warning" size="sm" className="gap-1 text-[10px]"><AlertCircle className="w-2.5 h-2.5" />Inactive</Badge>}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onRefresh(account.id)}>
                  <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />Sync Now
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(
                    platformProfileUrl(account.platform, account.accountUsername || account.accountName), '_blank'
                  )}
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-slate-500" />View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart2 className="w-4 h-4 mr-2 text-purple-500" />View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2 text-slate-500" />Account Settings
                </DropdownMenuItem>
                {isError && (
                  <DropdownMenuItem onClick={() => onReconnect(account.platform)}>
                    <Zap className="w-4 h-4 mr-2 text-orange-500" />Reconnect
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDisconnect(account.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">Connection error</p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{account.error}</p>
                <button
                  onClick={() => onReconnect(account.platform)}
                  className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline mt-1.5 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />Reconnect now
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-white">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-sm">{formatNumber(account.followerCount || 0)}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-900 dark:text-white">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-sm">{account.engagementRate ?? '0.0'}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Engagement</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {account.lastSyncedAt
                    ? new Date(account.lastSyncedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                    : 'Never'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Last sync</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function platformProfileUrl(platform: string, username: string): string {
  const clean = username.replace('@', '')
  const map: Record<string, string> = {
    facebook: `https://facebook.com/${clean}`,
    instagram: `https://instagram.com/${clean}`,
    twitter: `https://x.com/${clean}`,
    linkedin: `https://linkedin.com/company/${clean}`,
    tiktok: `https://tiktok.com/@${clean}`,
    youtube: `https://youtube.com/@${clean}`,
    pinterest: `https://pinterest.com/${clean}`,
    threads: `https://threads.net/@${clean}`,
  }
  return map[platform] || '#'
}

// ─── Platform Connect Card ───────────────────────────────────────────────────

interface PlatformCardProps {
  platform: { id: string; name: string; color: string }
  isConnected: boolean
  onConnect: (id: string) => void
}

function PlatformConnectCard({ platform, isConnected, onConnect }: PlatformCardProps) {
  const meta = PLATFORM_META[platform.id]
  return (
    <motion.button
      whileHover={!isConnected ? { y: -2 } : undefined}
      onClick={() => !isConnected && onConnect(platform.id)}
      disabled={isConnected}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all
        ${isConnected
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 cursor-default'
          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/50 cursor-pointer hover:shadow-md'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${platform.color}18` }}>
          {getPlatformIcon(platform.id, 26)}
        </div>
        {isConnected
          ? <Badge variant="success" size="sm" className="gap-1 text-[10px]"><CheckCircle2 className="w-2.5 h-2.5" />Connected</Badge>
          : <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><ArrowRight className="w-3.5 h-3.5 text-slate-400" /></div>
        }
      </div>
      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{platform.name}</h4>
      <p className="text-xs text-slate-400 mt-0.5 truncate">{isConnected ? 'Account linked' : meta?.tagline}</p>
    </motion.button>
  )
}

// ─── Connect Detail Modal ────────────────────────────────────────────────────

interface ConnectModalProps {
  platform: string | null
  isOpen: boolean
  onClose: () => void
  onStartOAuth: (platform: string) => void
}

function ConnectModal({ platform, isOpen, onClose, onStartOAuth }: ConnectModalProps) {
  if (!platform) return null
  const meta = PLATFORM_META[platform]
  const color = getPlatformColor(platform)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
              {getPlatformIcon(platform, 28)}
            </div>
            <div>
              <DialogTitle className="text-xl">{meta?.name}</DialogTitle>
              <DialogDescription>{meta?.tagline}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">{meta?.description}</p>

          {/* Account type */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Account Requirement</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{meta?.requiredAccountType}</p>
            </div>
          </div>

          {/* API note */}
          {meta?.apiNote && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">{meta.apiNote}</p>
            </div>
          )}

          {/* Permissions */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Permissions We'll Request</p>
            <div className="grid grid-cols-2 gap-2">
              {meta?.permissions.map((perm, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-base shrink-0">{perm.icon}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{perm.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How to Connect</p>
            <div className="space-y-2.5">
              {meta?.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: color }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
            <Shield className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-green-800 dark:text-green-400">Secure & Private</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                We only store encrypted access tokens — never your {meta?.name} password. Revoke anytime.
              </p>
            </div>
          </div>

          {/* OAuth scopes */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">OAuth 2.0 Scopes</p>
            <div className="flex flex-wrap gap-1.5">
              {meta?.oauthScopes.map(scope => (
                <span key={scope} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
                  {scope}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
            <a href={meta?.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Eye className="w-3.5 h-3.5" />Help Center
            </a>
            <span>·</span>
            <a href={meta?.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Link className="w-3.5 h-3.5" />API Docs
            </a>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { onClose(); onStartOAuth(platform) }}
            className="gap-2"
            style={{ backgroundColor: color, borderColor: color }}
          >
            {getPlatformIcon(platform, 15)}
            Authorize with {meta?.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function SocialAccounts() {
  const [connectModalPlatform, setConnectModalPlatform] = useState<string | null>(null)
  const [oauthPlatform, setOauthPlatform] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected')
  const { currentWorkspace } = useWorkspaceStore()
  const wsId = currentWorkspace?.id

  const { data: accountsData, isLoading, refetch } = useDataCache<any[]>(
    `social-accounts:${wsId}`,
    async () => {
      if (!wsId) return []
      const res = await socialAccountsApi.getAll(wsId) as any
      return res?.data?.accounts || res?.accounts || []
    },
    { enabled: !!wsId }
  )
  const accounts = accountsData ?? []
  const connectedPlatforms = accounts.map((a: any) => a.platform)

  const handleOAuthSuccess = async (data: { accountName: string; username: string; followers: number }) => {
    if (!oauthPlatform || !currentWorkspace) return
    const p = oauthPlatform
    setOauthPlatform(null)
    setIsSaving(true)
    try {
      await socialAccountsApi.connect(currentWorkspace.id, {
        platform: p,
        accessToken: `oauth2_${p}_${Date.now()}`,
        refreshToken: `refresh_${p}_${Date.now()}`,
        accountName: data.accountName,
        accountUsername: data.username,
        platformAccountId: `${p}_${Date.now()}`,
      })
      invalidateCache('social-accounts:*')
      refetch()
      setActiveTab('connected')
      toast.success(`${PLATFORM_META[p]?.name} connected successfully!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save account')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await socialAccountsApi.disconnect(id)
      invalidateCache('social-accounts:*')
      refetch()
      toast.success('Account disconnected')
    } catch { toast.error('Failed to disconnect') }
  }

  const handleRefresh = async (id: string) => {
    try {
      await (socialAccountsApi.sync ? socialAccountsApi.sync(id) : socialAccountsApi.refresh(id))
      invalidateCache('social-accounts:*')
      refetch()
      toast.success('Account synced')
    } catch {
      try { await socialAccountsApi.refresh(id); invalidateCache('social-accounts:*'); refetch(); toast.success('Account synced') }
      catch { toast.error('Failed to sync') }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {oauthPlatform && (
          <OAuthWindow
            key={oauthPlatform}
            platform={oauthPlatform}
            onSuccess={handleOAuthSuccess}
            onCancel={() => setOauthPlatform(null)}
          />
        )}
      </AnimatePresence>

      <ConnectModal
        platform={connectModalPlatform}
        isOpen={!!connectModalPlatform}
        onClose={() => setConnectModalPlatform(null)}
        onStartOAuth={p => setOauthPlatform(p)}
      />

      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Saving account…</p>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Social Accounts</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Connect and manage all your social media accounts in one place
            </p>
          </div>
          <Button onClick={() => setActiveTab('available')} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />Connect Account
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Connected', value: accounts.length, icon: <Link className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Active', value: accounts.filter((a: any) => a.isActive && !a.error).length, icon: <Wifi className="w-4 h-4" />, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
            { label: 'Total Followers', value: formatNumber(accounts.reduce((s: number, a: any) => s + (a.followerCount || 0), 0)), icon: <Users className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Platforms', value: `${accounts.length} / ${PLATFORMS.length}`, icon: <Globe className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {(['connected', 'available'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tab === 'connected' ? `Connected (${accounts.length})` : 'Add New'}
            </button>
          ))}
        </div>

        {/* Connected tab */}
        {activeTab === 'connected' && (
          accounts.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">No accounts connected yet</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Connect your social media accounts to start managing everything from one place.
                  </p>
                </div>
                <Button onClick={() => setActiveTab('available')} className="gap-2">
                  <Plus className="w-4 h-4" />Connect Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {accounts.map((account: any) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDisconnect={handleDisconnect}
                    onRefresh={handleRefresh}
                    onReconnect={p => setConnectModalPlatform(p)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}

        {/* Available tab */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">All Platforms</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PLATFORMS.map(p => (
                  <PlatformConnectCard
                    key={p.id}
                    platform={p}
                    isConnected={connectedPlatforms.includes(p.id)}
                    onConnect={id => setConnectModalPlatform(id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Platform Details</h2>
              <div className="space-y-3">
                {PLATFORMS.filter(p => !connectedPlatforms.includes(p.id)).map(platform => {
                  const meta = PLATFORM_META[platform.id]
                  const color = getPlatformColor(platform.id)
                  return (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                        {getPlatformIcon(platform.id, 26)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{platform.name}</h3>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono">
                            {meta?.authType === 'oauth2' ? 'OAuth 2.0' : 'API Key'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{meta?.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {meta?.requiredAccountType}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setConnectModalPlatform(platform.id)}
                        className="shrink-0 gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: color, borderColor: color }}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />Connect
                      </Button>
                    </motion.div>
                  )
                })}

                {PLATFORMS.filter(p => !connectedPlatforms.includes(p.id)).length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Award className="w-10 h-10 mx-auto mb-3 text-green-500" />
                    <p className="font-semibold text-slate-900 dark:text-white text-lg">All platforms connected!</p>
                    <p className="text-sm mt-1">You've connected all {PLATFORMS.length} available social media platforms.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}
