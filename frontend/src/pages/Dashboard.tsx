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

// Mock data for the dashboard
const stats = [
  {
    title: 'Total Impressions',
    value: 245890,
    change: 12.5,
    icon: Eye,
    color: 'indigo',
  },
  {
    title: 'Engagement Rate',
    value: 4.8,
    change: 0.8,
    icon: Heart,
    isPercentage: true,
    color: 'pink',
  },
  {
    title: 'Total Followers',
    value: 52400,
    change: 1240,
    icon: Users,
    color: 'purple',
  },
  {
    title: 'Scheduled Posts',
    value: 24,
    change: 8,
    icon: Clock,
    color: 'amber',
  },
]

const engagementData = [
  { date: 'Mon', impressions: 4000, engagement: 240, followers: 24 },
  { date: 'Tue', impressions: 3000, engagement: 198, followers: 42 },
  { date: 'Wed', impressions: 5000, engagement: 320, followers: 68 },
  { date: 'Thu', impressions: 4500, engagement: 280, followers: 34 },
  { date: 'Fri', impressions: 6000, engagement: 400, followers: 89 },
  { date: 'Sat', impressions: 5500, engagement: 380, followers: 56 },
  { date: 'Sun', impressions: 7000, engagement: 520, followers: 78 },
]

const platformData = [
  { name: 'Instagram', value: 45, color: '#E4405F' },
  { name: 'Twitter', value: 25, color: '#000000' },
  { name: 'LinkedIn', value: 15, color: '#0A66C2' },
  { name: 'Facebook', value: 10, color: '#1877F2' },
  { name: 'TikTok', value: 5, color: '#00F2EA' },
]

const topPosts = [
  {
    id: '1',
    caption: '🚀 Excited to announce our new product launch! After months of hard work...',
    platform: 'instagram',
    impressions: 45000,
    engagement: 3200,
    postedAt: '2026-01-28T10:00:00Z',
    imageUrl: 'https://picsum.photos/seed/1/400/400',
  },
  {
    id: '2',
    caption: 'The future of social media management is here. Thread 🧵',
    platform: 'twitter',
    impressions: 32000,
    engagement: 2800,
    postedAt: '2026-01-27T14:30:00Z',
    imageUrl: null,
  },
  {
    id: '3',
    caption: '5 tips to boost your LinkedIn engagement in 2026...',
    platform: 'linkedin',
    impressions: 28000,
    engagement: 1500,
    postedAt: '2026-01-26T09:00:00Z',
    imageUrl: 'https://picsum.photos/seed/3/400/400',
  },
]

const upcomingPosts = [
  {
    id: '1',
    caption: 'New blog post alert! 📝 Check out our latest insights...',
    platforms: ['instagram', 'facebook'],
    scheduledAt: '2026-02-01T10:00:00Z',
  },
  {
    id: '2',
    caption: 'Monday motivation: "Success is not final..."',
    platforms: ['twitter', 'linkedin'],
    scheduledAt: '2026-02-02T09:00:00Z',
  },
  {
    id: '3',
    caption: 'Behind the scenes of our latest photoshoot! 📸',
    platforms: ['instagram', 'tiktok'],
    scheduledAt: '2026-02-03T14:00:00Z',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export function Dashboard() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back! 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your social media today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/create">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Post
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change > 0

          return (
            <Card key={index} hover className="overflow-hidden">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {stat.title}
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.isPercentage
                        ? `${stat.value}%`
                        : formatNumber(stat.value)}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isPositive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {stat.isPercentage
                          ? `${stat.change}%`
                          : formatNumber(stat.change)}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-400 hidden sm:inline">vs last week</span>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 flex items-center justify-center shrink-0`}
                  >
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
        {/* Engagement Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Engagement Overview</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your performance over the last 7 days</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                View Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorImpressions)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="#EC4899"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Engagement by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-55 w-full min-h-45">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {platform.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {platform.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Your best content this week</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/analytics">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white line-clamp-2">
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
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(post.impressions)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatNumber(post.engagement)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Scheduled Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Posts</CardTitle>
                <CardDescription>Your scheduled content</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/calendar">
                  View Calendar
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white line-clamp-2">
                    {post.caption}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-1">
                      {post.platforms.map((platform) => (
                        <div
                          key={platform}
                          className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-medium text-white"
                          style={{ backgroundColor: getPlatformColor(platform) }}
                        >
                          {platform[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/create">
                <PlusCircle className="w-4 h-4 mr-2" />
                Schedule New Post
              </Link>
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
                  <h3 className="text-lg font-semibold text-white">
                    Create content with AI
                  </h3>
                  <p className="text-white/80 text-sm">
                    Generate captions, images, and more using AI
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="bg-white text-indigo-600 hover:bg-white/90"
                asChild
              >
                <Link to="/ai-studio">
                  Try AI Studio
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
