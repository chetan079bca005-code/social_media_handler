import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MousePointer,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { formatNumber, getPlatformColor, PLATFORMS, cn } from '../lib/utils'
import { analyticsApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import { useDataCache } from '../lib/useDataCache'

const COLORS = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B']

export function Analytics() {
  const { currentWorkspace } = useWorkspaceStore()
  const [dateRange, setDateRange] = useState('30')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const wsId = currentWorkspace?.id

  const { data: analytics, isLoading: loading, isRefreshing, refetch } = useDataCache(
    `analytics:${wsId}:${dateRange}:${selectedPlatform}`,
    async () => {
      if (!wsId) return null
      const days = parseInt(dateRange) || 30
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date().toISOString()
      const params: any = { startDate, endDate }
      if (selectedPlatform !== 'all') params.platform = selectedPlatform
      const res = await analyticsApi.getWorkspaceAnalytics(wsId, params)
      return res?.data?.analytics || res?.data || null
    },
    { enabled: !!wsId }
  )

  const overviewStats = [
    { title: 'Total Impressions', value: analytics?.totalImpressions || 0, change: 0, icon: Eye },
    { title: 'Total Engagement', value: analytics?.totalEngagement || 0, change: 0, icon: Heart },
    { title: 'Engagement Rate', value: analytics?.avgEngagementRate || 0, change: 0, isPercentage: true, icon: TrendingUp },
    { title: 'Follower Growth', value: analytics?.followerGrowth || 0, change: 0, icon: Users },
    { title: 'Total Reach', value: analytics?.totalReach || 0, change: 0, icon: MousePointer },
    { title: 'Total Posts', value: analytics?.totalPosts || 0, change: 0, icon: Share2 },
  ]

  const engagementTrends = (analytics?.trend || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    impressions: t.impressions || 0,
    engagement: t.engagement || 0,
    followers: t.followers || 0,
  }))

  const byPlatform = analytics?.byPlatform || {}
  const platformPerformance = Object.entries(byPlatform).map(([name, data]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    followers: data.followers || 0,
    engagement: data.engagementRate || data.avgEngagementRate || 0,
    posts: data.posts || 0,
    impressions: data.impressions || 0,
  }))

  const topPosts = (analytics?.topPosts || []).slice(0, 4)

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Track your social media performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-37.5">
              <Calendar className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-full sm:w-37.5">
              <Filter className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto" onClick={refetch}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />Refresh
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{stat.title}</span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.isPercentage ? `${stat.value.toFixed ? stat.value.toFixed(1) : stat.value}%` : formatNumber(stat.value)}
                </p>
                {stat.change !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {isPositive ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{stat.isPercentage ? `${stat.change}%` : formatNumber(stat.change)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Engagement Trends</CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </div>
              <Tabs defaultValue="impressions" className="w-auto">
                <TabsList>
                  <TabsTrigger value="impressions">Impressions</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="followers">Followers</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {engagementTrends.length > 0 ? (
              <div className="h-90 w-full min-h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementTrends}>
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
              <div className="flex items-center justify-center h-70 text-slate-400">
                <p>No trend data available for this period. Publish content and check back later.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance & Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Comparison across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            {platformPerformance.length > 0 ? (
              <>
                <div className="h-75 w-full min-h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                      <Bar dataKey="followers" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-4">
                  {platformPerformance.map((platform, index) => (
                    <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}>{platform.name[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{platform.name}</p>
                          <p className="text-xs text-slate-500">{formatNumber(platform.followers)} followers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {typeof platform.engagement === 'number' ? platform.engagement.toFixed(1) : platform.engagement}% ER
                        </p>
                        <p className="text-xs text-slate-500">{platform.posts} posts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-60 text-slate-400 text-sm text-center">
                Connect social accounts to see platform performance.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Best content this period</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.length > 0 ? topPosts.map((post: any, index: number) => (
              <div key={post.id || index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400">
                  #{index + 1}
                </div>
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white line-clamp-1">
                    {post.content || post.caption || 'Untitled post'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {(post.platform || post.platforms?.[0]) && (
                      <Badge variant="secondary" size="sm" style={{
                        backgroundColor: `${getPlatformColor(post.platform || post.platforms?.[0])}20`,
                        color: getPlatformColor(post.platform || post.platforms?.[0]),
                      }}>
                        {post.platform || post.platforms?.[0]}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatNumber(post.impressions || 0)}</span>
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{formatNumber(post.likes || post.engagement || 0)}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{formatNumber(post.comments || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No posts data available for this period. Publish content to see performance.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards (replaces mock audience demographics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Followers Overview</CardTitle>
            <CardDescription>Total audience size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-slate-900 dark:text-white">{formatNumber(analytics?.totalFollowers || 0)}</p>
              <p className="text-sm text-slate-500 mt-2">Total followers across all platforms</p>
              {(analytics?.followerGrowth || 0) !== 0 && (
                <div className="flex items-center justify-center gap-1 mt-3">
                  {analytics.followerGrowth > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                  <span className={`text-sm font-medium ${analytics.followerGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {analytics.followerGrowth > 0 ? '+' : ''}{formatNumber(analytics.followerGrowth)} this period
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Mix</CardTitle>
            <CardDescription>Follower distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {platformPerformance.length > 0 ? (
              <div className="h-55 w-full min-h-45">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformPerformance.map(p => ({ name: p.name, value: p.followers }))} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {platformPerformance.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-55 text-slate-400 text-sm text-center">
                No platform data available yet.
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {platformPerformance.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{p.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key metrics summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Engagement Rate</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {(analytics?.avgEngagementRate || 0).toFixed ? (analytics?.avgEngagementRate || 0).toFixed(1) : analytics?.avgEngagementRate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Impressions</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(analytics?.totalImpressions || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Reach</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(analytics?.totalReach || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">Posts Published</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{analytics?.totalPosts || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
