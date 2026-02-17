import { motion } from 'framer-motion'
import {
  Clock,
  Calendar,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
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
import { getPlatformColor, cn } from '../lib/utils'
import { postsApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import { useDataCache, invalidateCache } from '../lib/useDataCache'
import toast from 'react-hot-toast'

export function Scheduled() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspaceStore()
  const wsId = currentWorkspace?.id

  const { data: posts = [], isLoading, isRefreshing, refetch } = useDataCache<any[]>(
    `scheduled:${wsId}`,
    async () => {
      if (!wsId) return []
      const res = await postsApi.getAll({ status: 'SCHEDULED', limit: 100 })
      const d = res?.data || res
      return Array.isArray(d) ? d : d?.posts || []
    },
    { enabled: !!wsId }
  )

  const handleDelete = async (id: string) => {
    try {
      await postsApi.delete(id)
      invalidateCache('scheduled:*')
      invalidateCache('calendar:*')
      refetch()
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await postsApi.duplicate(id)
      invalidateCache('scheduled:*')
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
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Scheduled Posts
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} scheduled for publishing
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-1">No scheduled posts</h3>
              <p className="text-sm text-slate-400 mb-4">Create and schedule content to see it here.</p>
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
                    <div className="flex items-center gap-2 mt-1.5">
                      {platform && (
                        <Badge variant="secondary" size="sm" className="text-[10px] font-semibold"
                          style={{ backgroundColor: `${platformColor}15`, color: platformColor }}>
                          {platform}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })
                          : 'No date set'}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/create?edit=${post.id}`)}>
                        <Edit2 className="w-4 h-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(post.id)}>
                        <Copy className="w-4 h-4 mr-2" />Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(post.id)}>
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
    </motion.div>
  )
}
