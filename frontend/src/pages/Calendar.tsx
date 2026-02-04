import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
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

// Mock data for calendar events
const mockPosts = [
  {
    id: '1',
    title: '🚀 New product launch announcement...',
    start: '2026-02-01T10:00:00',
    platform: 'instagram',
    status: 'scheduled',
    caption: '🚀 Exciting news! We\'re launching our new product line next week. Stay tuned for more details! #launch #newproduct',
    mediaUrl: 'https://picsum.photos/seed/1/400/400',
  },
  {
    id: '2',
    title: 'Monday motivation post...',
    start: '2026-02-02T09:00:00',
    platform: 'twitter',
    status: 'scheduled',
    caption: '"Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill',
    mediaUrl: null,
  },
  {
    id: '3',
    title: 'Behind the scenes content...',
    start: '2026-02-03T14:00:00',
    platform: 'tiktok',
    status: 'scheduled',
    caption: 'Take a peek behind the curtains! 🎬 Here\'s how we make the magic happen. #BTS #behindthescenes',
    mediaUrl: 'https://picsum.photos/seed/3/400/400',
  },
  {
    id: '4',
    title: 'Industry insights article...',
    start: '2026-02-04T11:00:00',
    platform: 'linkedin',
    status: 'draft',
    caption: '5 trends that will shape our industry in 2026. Here\'s what every professional needs to know...',
    mediaUrl: 'https://picsum.photos/seed/4/400/400',
  },
  {
    id: '5',
    title: 'Customer testimonial...',
    start: '2026-01-30T15:00:00',
    platform: 'facebook',
    status: 'published',
    caption: 'We love hearing from our customers! Thank you @customer for the amazing feedback 💙',
    mediaUrl: 'https://picsum.photos/seed/5/400/400',
  },
  {
    id: '6',
    title: 'Weekly tips series...',
    start: '2026-01-29T10:00:00',
    platform: 'instagram',
    status: 'published',
    caption: '💡 Tip of the week: Here are 3 ways to boost your productivity...',
    mediaUrl: 'https://picsum.photos/seed/6/400/400',
  },
]

export function ContentCalendar() {
  const [selectedPost, setSelectedPost] = useState<typeof mockPosts[0] | null>(null)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredPosts = useMemo(() => {
    return mockPosts.filter((post) => {
      if (filterPlatform !== 'all' && post.platform !== filterPlatform) return false
      if (filterStatus !== 'all' && post.status !== filterStatus) return false
      return true
    })
  }, [filterPlatform, filterStatus])

  const calendarEvents = useMemo(() => {
    return filteredPosts.map((post) => ({
      id: post.id,
      title: post.title,
      start: post.start,
      backgroundColor: getPlatformColor(post.platform),
      borderColor: getPlatformColor(post.platform),
      extendedProps: {
        ...post,
      },
    }))
  }, [filteredPosts])

  const handleEventClick = (info: any) => {
    const post = filteredPosts.find((p) => p.id === info.event.id)
    if (post) {
      setSelectedPost(post)
      setIsPostModalOpen(true)
    }
  }

  const handleDateSelect = (selectInfo: any) => {
    // Navigate to create post with pre-filled date
    console.log('Create post for:', selectInfo.startStr)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'published':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'draft':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Content Calendar
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Plan and manage your content schedule
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Filters:
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-full sm:w-37.5">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-37.5">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(POST_STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:ml-auto">
              {Object.entries(POST_STATUS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded-full', value.color)} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {value.label}
                  </span>
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
                --fc-today-bg-color: rgba(99, 102, 241, 0.1);
                font-family: 'Inter', system-ui, sans-serif;
              }
              .dark .fc {
                --fc-border-color: #334155;
                --fc-page-bg-color: #0f172a;
                --fc-neutral-bg-color: #1e293b;
              }
              .fc .fc-button {
                font-weight: 500;
                border-radius: 8px;
                padding: 8px 16px;
              }
              .fc .fc-button-group .fc-button {
                border-radius: 0;
              }
              .fc .fc-button-group .fc-button:first-child {
                border-radius: 8px 0 0 8px;
              }
              .fc .fc-button-group .fc-button:last-child {
                border-radius: 0 8px 8px 0;
              }
              .fc-event {
                border-radius: 6px;
                padding: 2px 6px;
                font-size: 12px;
                cursor: pointer;
              }
              .fc-daygrid-day-number {
                padding: 8px;
                color: #64748b;
              }
              .dark .fc-daygrid-day-number {
                color: #94a3b8;
              }
              .fc-col-header-cell-cushion {
                padding: 10px;
                font-weight: 600;
                color: #475569;
              }
              .dark .fc-col-header-cell-cushion {
                color: #cbd5e1;
              }
              .fc-toolbar-title {
                font-size: 1.5rem !important;
                font-weight: 700 !important;
              }
              .fc-daygrid-event-dot {
                display: none;
              }
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
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>Posts scheduled for the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPosts
              .filter((post) => post.status === 'scheduled')
              .map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  {post.mediaUrl ? (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant="secondary"
                        size="sm"
                        style={{
                          backgroundColor: `${getPlatformColor(post.platform)}20`,
                          color: getPlatformColor(post.platform),
                        }}
                      >
                        {post.platform}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(post.start).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(post.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Post Detail Modal */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-lg">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getPlatformColor(selectedPost.platform) }}
                  >
                    {selectedPost.platform[0].toUpperCase()}
                  </div>
                  {selectedPost.platform.charAt(0).toUpperCase() + selectedPost.platform.slice(1)} Post
                </DialogTitle>
                <DialogDescription>
                  Scheduled for {new Date(selectedPost.start).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedPost.mediaUrl && (
                  <img
                    src={selectedPost.mediaUrl}
                    alt=""
                    className="w-full rounded-lg object-cover"
                  />
                )}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Caption
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {selectedPost.caption}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Status:</span>
                  <Badge variant={selectedPost.status === 'published' ? 'success' : 'secondary'}>
                    {POST_STATUS[selectedPost.status as keyof typeof POST_STATUS]?.label || selectedPost.status}
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPostModalOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Post
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
