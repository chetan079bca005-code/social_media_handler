import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Users,
  Send,
  Loader2,
  Check,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'
import { notificationsApi } from '../services/api'
import { useDataCache, invalidateCache } from '../lib/useDataCache'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, any>
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'post_published':
      return <Send className="w-4 h-4 text-emerald-500" />
    case 'post_failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'comment':
      return <MessageSquare className="w-4 h-4 text-blue-500" />
    case 'team':
      return <Users className="w-4 h-4 text-purple-500" />
    default:
      return <Bell className="w-4 h-4 text-slate-500" />
  }
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function Inbox() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const navigate = useNavigate()

  const { data: notifications = [], isLoading, isRefreshing, refetch } = useDataCache<Notification[]>(
    'notifications',
    async () => {
      const res = await notificationsApi.getAll()
      // sendPaginatedSuccess puts array at res.data directly
      const raw = res?.data
      const data = Array.isArray(raw) ? raw : (raw as any)?.notifications || []
      return data.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead ?? n.read ?? false,
        createdAt: n.createdAt,
        metadata: n.data || n.metadata,
      }))
    }
  )

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      invalidateCache('notifications')
      refetch()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      invalidateCache('notifications')
      refetch()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    // Navigate based on notification type and metadata
    const meta = notification.metadata || {}
    switch (notification.type) {
      case 'post_published':
      case 'post_scheduled':
        if (meta.postId) navigate(`/create?edit=${meta.postId}`)
        else navigate('/published')
        break
      case 'post_failed':
        if (meta.postId) navigate(`/create?edit=${meta.postId}`)
        else navigate('/scheduled')
        break
      case 'comment':
        navigate('/published')
        break
      case 'team':
      case 'team_invite':
        navigate('/team')
        break
      case 'analytics':
        navigate('/analytics')
        break
      default:
        // No specific navigation — just mark as read
        break
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await notificationsApi.delete(id)
      invalidateCache('notifications')
      refetch()
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            Inbox
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Your notifications and updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications list */}
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-slate-500">
                {filter === 'unread'
                  ? 'All caught up!'
                  : 'Connect social accounts and start posting to receive notifications.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer',
                  !notification.isRead && 'bg-blue-50/50 dark:bg-blue-900/10'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'text-sm',
                      notification.isRead
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'font-semibold text-slate-900 dark:text-white'
                    )}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteNotification(e, notification.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
