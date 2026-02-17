import { useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
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
import { socialAccountsApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import { useDataCache, invalidateCache } from '../lib/useDataCache'
import toast from 'react-hot-toast'

const platformInfo = {
  facebook: {
    name: 'Facebook',
    description: 'Connect your Facebook Page to manage posts, stories, and engagement.',
    features: ['Posts & Stories', 'Page Analytics', 'Comment Management', 'Scheduling'],
  },
  instagram: {
    name: 'Instagram',
    description: 'Connect your Instagram Business account to publish content and view insights.',
    features: ['Feed Posts', 'Stories', 'Reels', 'Insights', 'Shopping Tags'],
  },
  twitter: {
    name: 'Twitter / X',
    description: 'Connect your Twitter account to tweet, schedule threads, and monitor engagement.',
    features: ['Tweets', 'Threads', 'Polls', 'Analytics', 'DM Management'],
  },
  linkedin: {
    name: 'LinkedIn',
    description: 'Connect your LinkedIn profile or company page for professional content.',
    features: ['Posts', 'Articles', 'Documents', 'Company Updates', 'Analytics'],
  },
  tiktok: {
    name: 'TikTok',
    description: 'Connect your TikTok Business account to publish videos and track performance.',
    features: ['Video Posts', 'Analytics', 'Sound Selection', 'Hashtag Research'],
  },
  youtube: {
    name: 'YouTube',
    description: 'Connect your YouTube channel to manage videos, shorts, and community posts.',
    features: ['Video Uploads', 'Shorts', 'Community Posts', 'Analytics', 'Thumbnails'],
  },
  pinterest: {
    name: 'Pinterest',
    description: 'Connect your Pinterest Business account to create and schedule pins.',
    features: ['Pins', 'Boards', 'Idea Pins', 'Analytics', 'Shopping'],
  },
  threads: {
    name: 'Threads',
    description: 'Connect your Threads account to post and engage with your audience.',
    features: ['Posts', 'Replies', 'Reposts', 'Analytics'],
  },
}

export function SocialAccounts() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { currentWorkspace } = useWorkspaceStore()
  const wsId = currentWorkspace?.id

  const { data: accountsData, isLoading, refetch } = useDataCache<any[]>(
    `social-accounts:${wsId}`,
    async () => {
      if (!wsId) return []
      const res = await socialAccountsApi.getAll(wsId)
      const resData = res.data as any
      return resData?.data?.accounts || resData?.accounts || []
    },
    { enabled: !!wsId }
  )
  const accounts = accountsData ?? []

  const connectedPlatforms = (accounts || []).map((a: any) => a.platform)

  const handleConnect = (platform: string) => {
    setSelectedPlatform(platform)
    setIsConnectModalOpen(true)
  }

  const handleConfirmConnect = async () => {
    if (!selectedPlatform || !currentWorkspace) return

    setIsConnecting(true)
    try {
      await socialAccountsApi.connect(currentWorkspace.id, {
        platform: selectedPlatform,
        accessToken: 'demo-token',
        accountName: `@${selectedPlatform}_account`,
        platformAccountId: `${Date.now()}`,
      })
      // Account created on server — refetch to update list
      setIsConnectModalOpen(false)
      invalidateCache('social-accounts:*')
      refetch()
      toast.success(`${platformInfo[selectedPlatform as keyof typeof platformInfo]?.name} account connected!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect account')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    try {
      await socialAccountsApi.disconnect(accountId)
      invalidateCache('social-accounts:*')
      refetch()
      toast.success('Account disconnected')
    } catch {
      toast.error('Failed to disconnect account')
    }
  }

  const handleRefresh = async (accountId: string) => {
    try {
      await socialAccountsApi.refresh(accountId)
      invalidateCache('social-accounts:*')
      refetch()
      toast.success('Account synced successfully')
    } catch {
      toast.error('Failed to sync account')
    }
  }

  const handleReconnect = async (accountId: string) => {
    try {
      await socialAccountsApi.refresh(accountId)
      invalidateCache('social-accounts:*')
      refetch()
      toast.success('Account reconnected')
    } catch {
      toast.error('Failed to reconnect account')
    }
  }

  const getStatusBadge = (account: any) => {
    if (account.error) {
      return (
        <Badge variant="destructive" size="sm" className="gap-1">
          <XCircle className="w-3 h-3" />
          Error
        </Badge>
      )
    }
    if (account.isActive) {
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Connected
        </Badge>
      )
    }
    return (
      <Badge variant="warning" size="sm" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        Inactive
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Social Accounts
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Connect and manage your social media accounts
          </p>
        </div>
        <Button onClick={() => setIsConnectModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </Button>
      </div>

      {/* Connected Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className={account.error ? 'border-red-200 dark:border-red-800' : ''}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <Avatar
                      src={account.profileImageUrl}
                      alt={account.accountName}
                      size="lg"
                      className="w-10 h-10 sm:w-12 sm:h-12"
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-white dark:border-slate-800"
                      style={{ backgroundColor: getPlatformColor(account.platform) }}
                    >
                      {account.platform[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {account.accountName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {PLATFORMS.find((p) => p.id === account.platform)?.name}
                    </p>
                    {getStatusBadge(account)}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRefresh(account.id)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Now
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    {account.error && (
                      <DropdownMenuItem onClick={() => handleReconnect(account.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reconnect
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {account.error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{account.error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleReconnect(account.id)}
                  >
                    Reconnect Account
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formatNumber(account.followerCount)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Followers</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {account.engagementRate ?? '0.0'}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Engagement</span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Last synced</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Connect More Platforms</CardTitle>
          <CardDescription>
            Expand your social media presence by connecting additional accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLATFORMS.map((platform) => {
              const isConnected = connectedPlatforms.includes(platform.id)

              return (
                <button
                  key={platform.id}
                  onClick={() => !isConnected && handleConnect(platform.id)}
                  disabled={isConnected}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isConnected
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-3"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name[0]}
                  </div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {platform.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isConnected ? 'Already connected' : 'Click to connect'}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connect Modal */}
      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlatform
                ? `Connect ${platformInfo[selectedPlatform as keyof typeof platformInfo]?.name}`
                : 'Connect Account'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlatform
                ? platformInfo[selectedPlatform as keyof typeof platformInfo]?.description
                : 'Select a platform to connect'}
            </DialogDescription>
          </DialogHeader>

          {!selectedPlatform ? (
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.filter((p) => !connectedPlatforms.includes(p.id)).map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-center"
                >
                  <div
                    className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name[0]}
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-2">
                    {platform.name}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: getPlatformColor(selectedPlatform) }}
                >
                  {selectedPlatform[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {platformInfo[selectedPlatform as keyof typeof platformInfo]?.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Business or Creator account required
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Features you'll get:
                </h4>
                <ul className="space-y-1">
                  {platformInfo[selectedPlatform as keyof typeof platformInfo]?.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedPlatform && (
              <>
                <Button variant="outline" onClick={() => setSelectedPlatform(null)}>
                  Back
                </Button>
                <Button onClick={handleConfirmConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Account'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
