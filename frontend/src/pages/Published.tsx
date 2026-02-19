import { useState } from 'react'
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
  Trash2,
  ExternalLink,
  Search,
  Edit,
  ThumbsUp,
  MessageSquare,
  Share2,
  BarChart2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: postsData, isLoading, isRefreshing, refetch } = useDataCache<any>(
    `published:${wsId}:${page}`,
    async () => {
      if (!wsId) return { posts: [], total: 0 }
      const res = await postsApi.getAll({ status: 'PUBLISHED', limit, page })
      const d = res?.data || res
      if (Array.isArray(d)) return { posts: d, total: d.length }
      return { posts: d?.posts || [], total: d?.total || d?.posts?.length || 0 }
    },
    { enabled: !!wsId }
  )
  const allPosts: any[] = postsData?.posts ?? []
  const total: number = postsData?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  // Client-side search filter
  const posts = search.trim()
    ? allPosts.filter((p: any) =>
        (p.content || p.caption || '').toLowerCase().includes(search.toLowerCase())
      )
    : allPosts

  const handleDuplicate = async (id: string) => {
    try {
      await postsApi.duplicate(id)
      invalidateCache('published:*')
      refetch()
      toast.success('Post duplicated')
    } catch { toast.error('Failed to duplicate post') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this published post? This will also attempt to remove it from the social platform.')) return
    try {
      await postsApi.delete(id)
      invalidateCache('published:*')
      invalidateCache('calendar:*')
      invalidateCache('analytics:*')
      refetch()
      toast.success('Post deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete post')
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            Published Posts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} published</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm w-48 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Search posts..."
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} /> Refresh
          </Button>
          <Button asChild><Link to="/create"><Plus className="w-4 h-4 mr-2" />Create Post</Link></Button>
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
              const platforms = post.platforms || []
              const firstPlatform = platforms[0]?.socialAccount?.platform || platforms[0] || ''
              const platformName = typeof firstPlatform === 'string' ? firstPlatform : firstPlatform.platform || ''
              const platformColor = getPlatformColor(platformName.toLowerCase())
              const platformUrl = platforms[0]?.platformUrl
              const metrics = platforms[0]?.metrics || {}

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
                      {platforms.map((p: any, i: number) => {
                        const pName = p?.socialAccount?.platform || p || ''
                        const pColor = getPlatformColor((typeof pName === 'string' ? pName : '').toLowerCase())
                        return (
                          <Badge key={i} variant="secondary" size="sm" className="text-[10px] font-semibold"
                            style={{ backgroundColor: `${pColor}15`, color: pColor }}>
                            {typeof pName === 'string' ? pName : ''}
                          </Badge>
                        )
                      })}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                          : 'Published'}
                      </span>
                    </div>
                    {/* Engagement metrics */}
                    {(metrics.likes || metrics.comments || metrics.shares || metrics.impressions) && (
                      <div className="flex items-center gap-3 mt-2">
                        {metrics.likes != null && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />{formatNumber(metrics.likes)}
                          </span>
                        )}
                        {metrics.comments != null && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />{formatNumber(metrics.comments)}
                          </span>
                        )}
                        {metrics.shares != null && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Share2 className="w-3 h-3" />{formatNumber(metrics.shares)}
                          </span>
                        )}
                        {metrics.impressions != null && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Eye className="w-3 h-3" />{formatNumber(metrics.impressions)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {platformUrl && (
                        <DropdownMenuItem onClick={() => window.open(platformUrl, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" />View on Platform
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate(`/analytics`)}>
                        <BarChart2 className="w-4 h-4 mr-2" />View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(post.id)}>
                        <Copy className="w-4 h-4 mr-2" />Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      )}
    </motion.div>
  )
}
