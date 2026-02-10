import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  PlusCircle,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  Sparkles,
  Loader2,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatNumber, getPlatformColor } from '../lib/utils'
import { analyticsApi, postsApi } from '../services/api'
import { useWorkspaceStore, useAuthStore } from '../store'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Dashboard() {
  const { currentWorkspace } = useWorkspaceStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [topPosts, setTopPosts] = useState<any[]>([])
  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboard() {
      if (!currentWorkspace?.id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const [analyticsRes, scheduledRes, publishedRes] = await Promise.allSettled([
          analyticsApi.getWorkspaceAnalytics(currentWorkspace.id, {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          }),
          postsApi.getAll({ status: 'SCHEDULED', limit: 5 }),
          postsApi.getAll({ status: 'PUBLISHED', limit: 5, sortBy: 'engagement' }),
        ])

        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value?.data?.analytics || null)
        }
        if (scheduledRes.status === 'fulfilled') {
          const d = scheduledRes.value?.data || scheduledRes.value
          setUpcomingPosts(Array.isArray(d) ? d : d?.posts || [])
        }
        if (publishedRes.status === 'fulfilled') {
          const d = publishedRes.value?.data || publishedRes.value
          setTopPosts(Array.isArray(d) ? d : d?.posts || [])
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [currentWorkspace?.id])

  const stats = [
    {
      title: 'Total Impressions',
      value: analytics?.totalImpressions || 0,
      change: 0,
      icon: Eye,
      color: 'indigo',
    },
    {
      title: 'Engagement Rate',
      value: analytics?.avgEngagementRate || 0,
      change: 0,
      icon: Heart,
      isPercentage: true,
      color: 'pink',
    },
    {
      title: 'Total Followers',
      value: analytics?.totalFollowers || 0,
      change: analytics?.followerGrowth || 0,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Total Posts',
      value: analytics?.totalPosts || 0,
      change: 0,
      icon: Clock,
      color: 'amber',
    },
  ]

  const engagementData = (analytics?.trend || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    impressions: t.impressions || 0,
    engagement: t.engagement || 0,
  }))

  const byPlatform = analytics?.byPlatform || {}
  const platformData = Object.entries(byPlatform).map(([name, data]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    value: data.followers || data.engagement || 0,
    color: getPlatformColor(name.toLowerCase()),
  })).filter(p => p.value > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
        <span className="text-slate-500 text-lg">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your social media today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/create"><PlusCircle className="w-4 h-4 mr-2" />Create Post</Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          return (
            <Card key={index} hover className="overflow-hidden">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <p className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.isPercentage ? `${stat.value.toFixed(1)}%` : formatNumber(stat.value)}
                    </p>
                    {stat.change !== 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
                        <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{stat.isPercentage ? `${stat.change}%` : formatNumber(stat.change)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-6 sm:h-6 text-${stat.color}-500`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Engagement Overview</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your performance over the last 30 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {engagementData.length > 0 ? (
              <div className="h-60 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="impressions" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" />
                    <Area type="monotone" dataKey="engagement" stroke="#EC4899" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 text-slate-400">
                <p>No engagement data yet. Connect social accounts and publish posts to see trends.</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Impressions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Engagement</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Followers by platform</CardDescription>
          </CardHeader>
          <CardContent>
            {platformData.length > 0 ? (
              <>
                <div className="h-55 w-full min-h-45">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {platformData.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">{platform.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{formatNumber(platform.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-55 text-slate-400 text-sm text-center">
                Connect social accounts to see platform distribution.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Your best content recently</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/analytics">View All<ArrowUpRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.length > 0 ? topPosts.slice(0, 3).map((post: any) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-16 h-16 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white line-clamp-2">{post.content || post.caption || 'Untitled post'}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {post.platforms?.[0] && (
                      <Badge variant="secondary" size="sm" style={{ backgroundColor: `${getPlatformColor(post.platforms[0])}20`, color: getPlatformColor(post.platforms[0]) }}>
                        {post.platforms[0]}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No published posts yet. Create and publish content to see top performers.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Posts</CardTitle>
                <CardDescription>Your scheduled content</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/calendar">View Calendar<ArrowUpRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPosts.length > 0 ? upcomingPosts.slice(0, 3).map((post: any) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white line-clamp-2">{post.content || 'Untitled post'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {(post.platforms || []).map((p: string) => (
                      <div key={p} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-medium text-white"
                        style={{ backgroundColor: getPlatformColor(p) }}>
                        {p[0]?.toUpperCase()}
                      </div>
                    ))}
                    <span className="text-xs text-slate-500">
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No scheduled posts. Plan your content ahead!
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/create"><PlusCircle className="w-4 h-4 mr-2" />Schedule New Post</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card variant="gradient">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create content with AI</h3>
                  <p className="text-white/80 text-sm">Generate captions, images, and more using AI</p>
                </div>
              </div>
              <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-white/90" asChild>
                <Link to="/ai-studio">Try AI Studio<ArrowUpRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
