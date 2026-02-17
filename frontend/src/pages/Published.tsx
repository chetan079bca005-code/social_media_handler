import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Eye,
  Copy,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import { getPlatformColor, cn, formatNumber } from '../lib/utils'
import { postsApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import { useDataCache, invalidateCache } from '../lib/useDataCache'
import toast from 'react-hot-toast'

export function Published() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspaceStore()
  const wsId = currentWorkspace?.id

  const { data: posts = [], isLoading, isRefreshing, refetch } = useDataCache<any[]>(
    `published:${wsId}`,
    async () => {
      if (!wsId) return []
      const res = await postsApi.getAll({ status: 'PUBLISHED', limit: 100 })
      const d = res?.data || res
      return Array.isArray(d) ? d : d?.posts || []
    },
    { enabled: !!wsId }
  )

  const handleDuplicate = async (id: string) => {
    try {
      await postsApi.duplicate(id)
      invalidateCache('published:*')
      refetch()
      toast.success('Post duplicated')
    } catch {
      toast.error('Failed to duplicate post')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-56" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            Published Posts
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} published
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Posts List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-1">No published posts yet</h3>
              <p className="text-sm text-slate-400 mb-4">Your published content will appear here.</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/create"><Plus className="w-4 h-4 mr-2" />Create Post</Link>
              </Button>
            </div>
          ) : (
            posts.map((post: any) => {
              const platform = post.platforms?.[0] || post.platform || ''
              const platformColor = getPlatformColor(platform.toLowerCase())
              return (
                <div key={post.id}
                  className="flex items-center gap-4 p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${platformColor}15` }}>
                    <Calendar className="w-5 h-5" style={{ color: platformColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {post.content || post.caption || 'Untitled post'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {platform && (
                        <Badge variant="secondary" size="sm" className="text-[10px] font-semibold"
                          style={{ backgroundColor: `${platformColor}15`, color: platformColor }}>
                          {platform}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })
                          : 'Published'}
                      </span>
                      {(post.impressions || post.engagement) && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {formatNumber(post.impressions || 0)} views
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDuplicate(post.id)}>
                        <Copy className="w-4 h-4 mr-2" />Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
