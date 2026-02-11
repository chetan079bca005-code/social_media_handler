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
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
} from '../components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import { getPlatformColor, formatNumber, PLATFORMS } from '../lib/utils'
import toast from 'react-hot-toast'

// Mock connected accounts
const mockAccounts = [
  {
    id: '1',
    platform: 'instagram',
    accountName: '@socialhub_official',
    accountId: '123456789',
    profileImageUrl: 'https://picsum.photos/seed/ig/200/200',
    followerCount: 24500,
    engagementRate: 5.2,
    isActive: true,
    lastSyncedAt: '2026-01-31T10:00:00Z',
    connectedAt: '2025-06-15T10:00:00Z',
  },
  {
    id: '2',
    platform: 'twitter',
    accountName: '@socialhub',
    accountId: '987654321',
    profileImageUrl: 'https://picsum.photos/seed/tw/200/200',
    followerCount: 12300,
    engagementRate: 3.8,
    isActive: true,
    lastSyncedAt: '2026-01-31T09:30:00Z',
    connectedAt: '2025-07-20T10:00:00Z',
  },
  {
    id: '3',
    platform: 'linkedin',
    accountName: 'SocialHub Inc.',
    accountId: '456789123',
    profileImageUrl: 'https://picsum.photos/seed/li/200/200',
    followerCount: 8200,
    engagementRate: 4.5,
    isActive: true,
    lastSyncedAt: '2026-01-31T08:00:00Z',
    connectedAt: '2025-08-10T10:00:00Z',
  },
  {
    id: '4',
    platform: 'facebook',
    accountName: 'SocialHub',
    accountId: '789123456',
    profileImageUrl: 'https://picsum.photos/seed/fb/200/200',
    followerCount: 5600,
    engagementRate: 2.9,
    isActive: false,
    lastSyncedAt: '2026-01-20T10:00:00Z',
    connectedAt: '2025-05-01T10:00:00Z',
    error: 'Token expired. Please reconnect.',
  },
]

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
  const [accounts, setAccounts] = useState(mockAccounts)

  const connectedPlatforms = accounts.map((a) => a.platform)

  const handleConnect = (platform: string) => {
    setSelectedPlatform(platform)
    setIsConnectModalOpen(true)
  }

  const handleConfirmConnect = async () => {
    if (!selectedPlatform) return

    setIsConnecting(true)
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock new account
    const newAccount = {
      id: `new-${Date.now()}`,
      platform: selectedPlatform,
      accountName: `@new_${selectedPlatform}_account`,
      accountId: `${Date.now()}`,
      profileImageUrl: `https://picsum.photos/seed/${selectedPlatform}new/200/200`,
      followerCount: Math.floor(Math.random() * 10000),
      engagementRate: Number((Math.random() * 5 + 1).toFixed(1)),
      isActive: true,
      lastSyncedAt: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
    }

    setAccounts([...accounts, newAccount])
    setIsConnecting(false)
    setIsConnectModalOpen(false)
    toast.success(`${platformInfo[selectedPlatform as keyof typeof platformInfo]?.name} account connected!`)
  }

  const handleDisconnect = (accountId: string) => {
    setAccounts(accounts.filter((a) => a.id !== accountId))
    toast.success('Account disconnected')
  }

  const handleRefresh = async (_accountId: string) => {
    toast.success('Account synced successfully')
  }

  const handleReconnect = async (accountId: string) => {
    setAccounts(
      accounts.map((a) =>
        a.id === accountId ? { ...a, isActive: true, error: undefined } : a
      )
    )
    toast.success('Account reconnected')
  }

  const getStatusBadge = (account: typeof mockAccounts[0]) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Demo Mode</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              The accounts shown below are simulated for demonstration. To connect real social media accounts, 
              you'll need to set up OAuth credentials (Client ID & Secret) for each platform in the backend <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file.
            </p>
          </div>
        </div>
      </div>

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
                      {account.engagementRate}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Engagement</span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Last synced</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {new Date(account.lastSyncedAt).toLocaleDateString()}
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
