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
import { formatNumber, getPlatformColor, PLATFORMS } from '../lib/utils'

// Mock data
const overviewStats = [
  {
    title: 'Total Impressions',
    value: 1245890,
    change: 12.5,
    icon: Eye,
  },
  {
    title: 'Total Engagement',
    value: 52400,
    change: 8.3,
    icon: Heart,
  },
  {
    title: 'Engagement Rate',
    value: 4.2,
    change: 0.5,
    isPercentage: true,
    icon: TrendingUp,
  },
  {
    title: 'Follower Growth',
    value: 3240,
    change: 15.2,
    icon: Users,
  },
  {
    title: 'Click-through Rate',
    value: 2.8,
    change: -0.3,
    isPercentage: true,
    icon: MousePointer,
  },
  {
    title: 'Total Shares',
    value: 8420,
    change: 22.1,
    icon: Share2,
  },
]

const engagementTrends = [
  { date: 'Jan 1', impressions: 42000, engagement: 2100, followers: 320 },
  { date: 'Jan 5', impressions: 38000, engagement: 1980, followers: 280 },
  { date: 'Jan 10', impressions: 52000, engagement: 2800, followers: 420 },
  { date: 'Jan 15', impressions: 48000, engagement: 2400, followers: 380 },
  { date: 'Jan 20', impressions: 61000, engagement: 3200, followers: 520 },
  { date: 'Jan 25', impressions: 55000, engagement: 2900, followers: 450 },
  { date: 'Jan 30', impressions: 72000, engagement: 3800, followers: 620 },
]

const platformPerformance = [
  { name: 'Instagram', followers: 24500, engagement: 5.2, posts: 48, impressions: 520000 },
  { name: 'Twitter', followers: 12300, engagement: 3.8, posts: 86, impressions: 280000 },
  { name: 'LinkedIn', followers: 8200, engagement: 4.5, posts: 24, impressions: 150000 },
  { name: 'Facebook', followers: 5600, engagement: 2.9, posts: 32, impressions: 95000 },
  { name: 'TikTok', followers: 1900, engagement: 8.2, posts: 12, impressions: 180000 },
]

const topPosts = [
  {
    id: '1',
    platform: 'instagram',
    caption: '🚀 Excited to announce our new product launch! After months of hard work...',
    impressions: 45000,
    engagement: 3200,
    likes: 2800,
    comments: 245,
    shares: 155,
    date: '2026-01-28',
    imageUrl: 'https://picsum.photos/seed/1/400/400',
  },
  {
    id: '2',
    platform: 'twitter',
    caption: 'The future of social media management is here. Thread 🧵',
    impressions: 32000,
    engagement: 2800,
    likes: 1900,
    comments: 580,
    shares: 320,
    date: '2026-01-27',
    imageUrl: null,
  },
  {
    id: '3',
    platform: 'linkedin',
    caption: '5 tips to boost your LinkedIn engagement in 2026...',
    impressions: 28000,
    engagement: 1500,
    likes: 1100,
    comments: 280,
    shares: 120,
    date: '2026-01-26',
    imageUrl: 'https://picsum.photos/seed/3/400/400',
  },
  {
    id: '4',
    platform: 'tiktok',
    caption: 'POV: When your social media strategy finally works 😂',
    impressions: 180000,
    engagement: 15000,
    likes: 12000,
    comments: 2100,
    shares: 900,
    date: '2026-01-25',
    imageUrl: 'https://picsum.photos/seed/4/400/400',
  },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars

const audienceDemographics = {
  age: [
    { range: '18-24', value: 25 },
    { range: '25-34', value: 35 },
    { range: '35-44', value: 22 },
    { range: '45-54', value: 12 },
    { range: '55+', value: 6 },
  ],
  gender: [
    { name: 'Male', value: 45 },
    { name: 'Female', value: 52 },
    { name: 'Other', value: 3 },
  ],
  topLocations: [
    { country: 'United States', percentage: 42 },
    { country: 'United Kingdom', percentage: 18 },
    { country: 'Canada', percentage: 12 },
    { country: 'Australia', percentage: 8 },
    { country: 'Germany', percentage: 6 },
  ],
}

const COLORS = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B']

export function Analytics() {
  const [dateRange, setDateRange] = useState('30')
  const [selectedPlatform, setSelectedPlatform] = useState('all')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Track your social media performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-37.5">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
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
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
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
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change > 0

          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.isPercentage ? `${stat.value}%` : formatNumber(stat.value)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isPositive ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {stat.isPercentage ? `${stat.change}%` : formatNumber(stat.change)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trends */}
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
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance & Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Comparison across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75 w-full min-h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="followers" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {platformPerformance.map((platform, index) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {platform.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {platform.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(platform.followers)} followers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {platform.engagement}% ER
                    </p>
                    <p className="text-xs text-slate-500">
                      {platform.posts} posts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Best content this period</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400">
                  #{index + 1}
                </div>
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white line-clamp-1">
                    {post.caption}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
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
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" />
                        {formatNumber(post.impressions)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3" />
                        {formatNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3" />
                        {formatNumber(post.comments)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Audience Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>Your audience by age group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audienceDemographics.age.map((item, index) => (
                <div key={item.range} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{item.range}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Audience breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-55 w-full min-h-45">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={audienceDemographics.gender}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {audienceDemographics.gender.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {audienceDemographics.gender.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Where your audience is from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audienceDemographics.topLocations.map((location, index) => (
                <div key={location.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">#{index + 1}</span>
                    <span className="text-sm text-slate-900 dark:text-white">
                      {location.country}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {location.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
