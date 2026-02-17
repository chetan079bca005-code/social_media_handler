import { useState, useMemo } from 'react'
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
import { useDataCache, invalidateCache } from '../lib/useDataCache'

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
  const wsId = currentWorkspace?.id
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data: posts = [], isLoading: loading, isRefreshing, refetch } = useDataCache<CalendarPost[]>(
    `calendar:${wsId}`,
    async () => {
      if (!wsId) return []
      const res = await postsApi.getAll({ limit: 200 })
      const d = res?.data || res
      return Array.isArray(d) ? d : d?.posts || []
    },
    { enabled: !!wsId }
  )

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
      invalidateCache('calendar:*')
      refetch()
      setIsPostModalOpen(false)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleDuplicatePost = async (id: string) => {
    try {
      await postsApi.duplicate(id)
      invalidateCache('calendar:*')
      refetch()
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
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-56" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="h-125 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            Content Calendar
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Plan and manage your content schedule
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />Refresh
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/create"><Plus className="w-4 h-4 mr-2" />Create Post</Link>
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Scheduled', key: 'scheduled', gradient: 'from-blue-500 to-blue-600', icon: Clock, bg: 'bg-blue-500/10' },
          { label: 'Published', key: 'published', gradient: 'from-emerald-500 to-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-500/10' },
          { label: 'Draft', key: 'draft', gradient: 'from-slate-400 to-slate-500', icon: AlertCircle, bg: 'bg-slate-400/10' },
          { label: 'Failed', key: 'failed', gradient: 'from-red-500 to-red-600', icon: XCircle, bg: 'bg-red-500/10' },
        ].map(({ label, key, gradient, icon: Icon, bg }) => (
          <Card key={key} className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm overflow-hidden relative">
            <div className={cn('absolute inset-0 bg-linear-to-br opacity-[0.03]', gradient)} />
            <CardContent className="p-4 flex items-center gap-3 relative">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', key === 'scheduled' ? 'text-blue-500' : key === 'published' ? 'text-emerald-500' : key === 'failed' ? 'text-red-500' : 'text-slate-400')} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statusCounts[key] || 0}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
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
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="calendar-container p-4 sm:p-6">
            <style>{`
              .fc {
                --fc-border-color: #e2e8f0;
                --fc-button-bg-color: #6366f1;
                --fc-button-border-color: #6366f1;
                --fc-button-hover-bg-color: #4f46e5;
                --fc-button-hover-border-color: #4f46e5;
                --fc-button-active-bg-color: #4338ca;
                --fc-button-active-border-color: #4338ca;
                --fc-today-bg-color: rgba(99, 102, 241, 0.06);
                font-family: 'Inter', system-ui, sans-serif;
              }
              .dark .fc {
                --fc-border-color: #1e293b;
                --fc-page-bg-color: transparent;
                --fc-neutral-bg-color: #1e293b;
                --fc-today-bg-color: rgba(99, 102, 241, 0.08);
              }
              .fc .fc-toolbar { 
                margin-bottom: 1.5rem !important;
                flex-wrap: wrap;
                gap: 8px;
              }
              .fc .fc-toolbar-title {
                font-size: 1.25rem !important;
                font-weight: 700 !important;
                color: #1e293b;
              }
              .dark .fc .fc-toolbar-title { color: #f1f5f9; }
              .fc .fc-button {
                font-weight: 500;
                font-size: 13px;
                border-radius: 8px !important;
                padding: 6px 14px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                transition: all 0.15s ease;
              }
              .fc .fc-button:focus { box-shadow: 0 0 0 2px rgba(99,102,241,0.3) !important; }
              .fc .fc-button-group .fc-button { border-radius: 0 !important; }
              .fc .fc-button-group .fc-button:first-child { border-radius: 8px 0 0 8px !important; }
              .fc .fc-button-group .fc-button:last-child { border-radius: 0 8px 8px 0 !important; }
              .fc-event {
                border-radius: 6px !important;
                padding: 3px 8px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                border: none !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: transform 0.1s ease, box-shadow 0.1s ease;
              }
              .fc-event:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 6px rgba(0,0,0,0.12);
              }
              .fc-daygrid-day {
                transition: background-color 0.15s ease;
              }
              .fc-daygrid-day:hover {
                background-color: rgba(99, 102, 241, 0.03);
              }
              .fc-daygrid-day-number {
                padding: 8px 10px;
                font-size: 13px;
                font-weight: 500;
                color: #64748b;
              }
              .fc-day-today .fc-daygrid-day-number {
                background: #6366f1;
                color: white !important;
                border-radius: 8px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 4px;
              }
              .dark .fc-daygrid-day-number { color: #94a3b8; }
              .fc-col-header-cell {
                border-bottom: 2px solid #e2e8f0 !important;
              }
              .dark .fc-col-header-cell { border-bottom-color: #1e293b !important; }
              .fc-col-header-cell-cushion {
                padding: 12px 8px;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
              }
              .dark .fc-col-header-cell-cushion { color: #94a3b8; }
              .fc-daygrid-event-dot { display: none; }
              .fc-daygrid-more-link {
                font-size: 11px;
                font-weight: 600;
                color: #6366f1;
                padding: 2px 6px;
                border-radius: 4px;
              }
              .fc-daygrid-more-link:hover { background: rgba(99,102,241,0.1); }
              .fc-list-event { cursor: pointer; }
              .fc-list-event:hover td { background: rgba(99,102,241,0.03) !important; }
              .fc th, .fc td { border-color: #f1f5f9 !important; }
              .dark .fc th, .dark .fc td { border-color: #1e293b !important; }
              .fc .fc-scrollgrid { border: none !important; }
              .fc .fc-scrollgrid td:last-of-type { border-right: none !important; }
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
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                Upcoming Scheduled Posts
              </CardTitle>
              <CardDescription className="mt-1">Your next scheduled content</CardDescription>
            </div>
            {scheduledPosts.length > 0 && (
              <Badge variant="secondary" className="text-xs">{scheduledPosts.length} upcoming</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length > 0 ? (
            <div className="space-y-2">
              {scheduledPosts.slice(0, 10).map((post, index) => {
                const platform = post.platforms?.[0] || post.platform || ''
                const platformColor = getPlatformColor(platform.toLowerCase())
                return (
                  <div key={post.id}
                    className="flex items-center gap-4 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all duration-200 group">
                    <div className="hidden sm:flex items-center justify-center w-8 text-xs font-bold text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${platformColor}15` }}>
                      <CalendarIcon className="w-5 h-5" style={{ color: platformColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
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
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No scheduled posts</h3>
              <p className="text-sm text-slate-400 mb-4">Create and schedule content to see it here.</p>
              <Button variant="outline" size="sm" asChild>
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
