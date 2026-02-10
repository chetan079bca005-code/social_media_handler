import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { getPlatformColor, PLATFORMS, POST_STATUS, cn } from '../lib/utils'
import { Link } from 'react-router-dom'
import { postsApi } from '../services/api'
import { useWorkspaceStore } from '../store'

interface CalendarPost {
  id: string
  content?: string
  caption?: string
  title?: string
  platforms?: string[]
  platform?: string
  status: string
  scheduledAt?: string
  publishedAt?: string
  createdAt?: string
  mediaUrls?: string[]
  mediaUrl?: string
}

export function ContentCalendar() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspaceStore()
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchPosts = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await postsApi.getAll({ limit: 200 })
      const d = res?.data || res
      const list = Array.isArray(d) ? d : d?.posts || []
      setPosts(list)
    } catch (err) {
      console.error('Calendar fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterPlatform !== 'all') {
        const postPlatforms = post.platforms || (post.platform ? [post.platform] : [])
        if (!postPlatforms.some(p => p.toLowerCase() === filterPlatform.toLowerCase())) return false
      }
      if (filterStatus !== 'all' && post.status?.toLowerCase() !== filterStatus.toLowerCase()) return false
      return true
    })
  }, [posts, filterPlatform, filterStatus])

  const calendarEvents = useMemo(() => {
    return filteredPosts.map((post) => {
      const date = post.scheduledAt || post.publishedAt || post.createdAt
      const platform = post.platforms?.[0] || post.platform || ''
      const label = post.content?.substring(0, 50) || post.caption?.substring(0, 50) || post.title || 'Untitled'
      return {
        id: post.id,
        title: label,
        start: date,
        backgroundColor: getPlatformColor(platform.toLowerCase()),
        borderColor: getPlatformColor(platform.toLowerCase()),
        extendedProps: { ...post },
      }
    }).filter(e => e.start)
  }, [filteredPosts])

  const handleEventClick = (info: any) => {
    const post = posts.find((p) => p.id === info.event.id)
    if (post) {
      setSelectedPost(post)
      setIsPostModalOpen(true)
    }
  }

  const handleDateSelect = (selectInfo: any) => {
    navigate(`/create?date=${selectInfo.startStr}`)
  }

  const handleDeletePost = async (id: string) => {
    try {
      await postsApi.delete(id)
      setPosts(prev => prev.filter(p => p.id !== id))
      setIsPostModalOpen(false)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleDuplicatePost = async (id: string) => {
    try {
      await postsApi.duplicate(id)
      fetchPosts()
    } catch (err) {
      console.error('Duplicate error:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />
      case 'published': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'draft': return <AlertCircle className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'scheduled': return 'bg-blue-500'
      case 'published': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'draft': return 'bg-gray-400'
      default: return 'bg-slate-400'
    }
  }

  const scheduledPosts = filteredPosts.filter(
    (p) => p.status?.toLowerCase() === 'scheduled'
  ).sort((a, b) => {
    const da = new Date(a.scheduledAt || '').getTime()
    const db = new Date(b.scheduledAt || '').getTime()
    return da - db
  })

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    posts.forEach(p => {
      const s = p.status?.toLowerCase() || 'unknown'
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [posts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
        <span className="text-slate-500 text-lg">Loading calendar...</span>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Content Calendar</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Plan and manage your content schedule
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchPosts}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/create"><Plus className="w-4 h-4 mr-2" />Create Post</Link>
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Scheduled', key: 'scheduled', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Clock },
          { label: 'Published', key: 'published', color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
          { label: 'Draft', key: 'draft', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20', icon: AlertCircle },
          { label: 'Failed', key: 'failed', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
        ].map(({ label, key, color, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{statusCounts[key] || 0}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filters:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-full sm:w-37.5"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-37.5"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(POST_STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:ml-auto">
              {Object.entries(POST_STATUS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded-full', value.color)} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{value.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="calendar-container">
            <style>{`
              .fc {
                --fc-border-color: #e2e8f0;
                --fc-button-bg-color: #6366f1;
                --fc-button-border-color: #6366f1;
                --fc-button-hover-bg-color: #4f46e5;
                --fc-button-hover-border-color: #4f46e5;
                --fc-button-active-bg-color: #4338ca;
                --fc-button-active-border-color: #4338ca;
                --fc-today-bg-color: rgba(99, 102, 241, 0.08);
                font-family: 'Inter', system-ui, sans-serif;
              }
              .dark .fc {
                --fc-border-color: #334155;
                --fc-page-bg-color: #0f172a;
                --fc-neutral-bg-color: #1e293b;
              }
              .fc .fc-button { font-weight: 500; border-radius: 8px; padding: 8px 16px; }
              .fc .fc-button-group .fc-button { border-radius: 0; }
              .fc .fc-button-group .fc-button:first-child { border-radius: 8px 0 0 8px; }
              .fc .fc-button-group .fc-button:last-child { border-radius: 0 8px 8px 0; }
              .fc-event { border-radius: 6px; padding: 2px 6px; font-size: 12px; cursor: pointer; }
              .fc-daygrid-day-number { padding: 8px; color: #64748b; }
              .dark .fc-daygrid-day-number { color: #94a3b8; }
              .fc-col-header-cell-cushion { padding: 10px; font-weight: 600; color: #475569; }
              .dark .fc-col-header-cell-cushion { color: #cbd5e1; }
              .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 700 !important; }
              .fc-daygrid-event-dot { display: none; }
            `}</style>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek',
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              selectable={true}
              select={handleDateSelect}
              height="auto"
              dayMaxEvents={3}
              eventDisplay="block"
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Scheduled Posts</CardTitle>
          <CardDescription>Your next scheduled content</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length > 0 ? (
            <div className="space-y-3">
              {scheduledPosts.slice(0, 10).map((post) => {
                const platform = post.platforms?.[0] || post.platform || ''
                return (
                  <div key={post.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {post.content || post.caption || 'Untitled post'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {platform && (
                          <Badge variant="secondary" size="sm"
                            style={{ backgroundColor: `${getPlatformColor(platform.toLowerCase())}20`, color: getPlatformColor(platform.toLowerCase()) }}>
                            {platform}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          }) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(post.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedPost(post); setIsPostModalOpen(true); }}>
                            <Eye className="w-4 h-4 mr-2" />View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/create?edit=${post.id}`)}>
                            <Edit2 className="w-4 h-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePost(post.id)}>
                            <Copy className="w-4 h-4 mr-2" />Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePost(post.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No scheduled posts. Create and schedule content to see it here.</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/create"><Plus className="w-4 h-4 mr-2" />Create Post</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Detail Modal */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-lg">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(selectedPost.platforms?.[0] || selectedPost.platform) && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: getPlatformColor((selectedPost.platforms?.[0] || selectedPost.platform || '').toLowerCase()) }}>
                      {(selectedPost.platforms?.[0] || selectedPost.platform || '')[0]?.toUpperCase()}
                    </div>
                  )}
                  Post Details
                </DialogTitle>
                <DialogDescription>
                  {selectedPost.scheduledAt
                    ? `Scheduled for ${new Date(selectedPost.scheduledAt).toLocaleString()}`
                    : selectedPost.publishedAt
                    ? `Published on ${new Date(selectedPost.publishedAt).toLocaleString()}`
                    : 'Draft'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Content</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {selectedPost.content || selectedPost.caption || 'No content'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">Status:</span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedPost.status)}
                    <span className="text-sm font-medium capitalize">{selectedPost.status?.toLowerCase()}</span>
                  </div>
                </div>
                {(selectedPost.platforms || []).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">Platforms:</span>
                    {(selectedPost.platforms || []).map((p: string) => (
                      <Badge key={p} variant="secondary" size="sm"
                        style={{ backgroundColor: `${getPlatformColor(p.toLowerCase())}20`, color: getPlatformColor(p.toLowerCase()) }}>
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="destructive" size="sm" onClick={() => handleDeletePost(selectedPost.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </Button>
                <Button variant="outline" onClick={() => setIsPostModalOpen(false)}>Close</Button>
                <Button onClick={() => navigate(`/create?edit=${selectedPost.id}`)}>
                  <Edit2 className="w-4 h-4 mr-2" />Edit Post
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
