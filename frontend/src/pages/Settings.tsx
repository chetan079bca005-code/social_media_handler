import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Key,
  Trash2,
  Save,
  Camera,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Switch } from '../components/ui/Switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/Dialog'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'
import { useUIStore } from '../store'

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isDirty, setIsDirty] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { theme: storeTheme, setTheme: setStoreTheme } = useUIStore()

  // Profile settings
  const [profile, setProfile] = useState({
    name: 'John Smith',
    email: 'john@company.com',
    bio: 'Social media manager passionate about creating engaging content.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    phone: '+1 (555) 123-4567',
    company: 'Acme Inc.',
    website: 'https://example.com',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewComments: true,
    emailPostPublished: true,
    emailTeamActivity: false,
    emailWeeklyReport: true,
    pushNewComments: true,
    pushPostPublished: true,
    pushTeamActivity: true,
    pushWeeklyReport: false,
  })

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: storeTheme,
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  })

  // Sync appearance.theme with store
  useEffect(() => {
    setAppearance(prev => ({ ...prev, theme: storeTheme }))
  }, [storeTheme])

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
  })

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully')
    setIsDirty(false)
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [field]: value }))
    toast.success('Notification preferences updated')
  }

  const handleAppearanceChange = (field: string, value: string) => {
    setAppearance((prev) => ({ ...prev, [field]: value }))
    if (field === 'theme') {
      setStoreTheme(value as 'light' | 'dark' | 'system')
    }
    toast.success('Appearance settings updated')
  }

  const handleChangePassword = () => {
    toast.success('Password change email sent')
  }

  const handleEnable2FA = () => {
    setSecurity((prev) => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
    toast.success(security.twoFactorEnabled ? '2FA disabled' : '2FA enabled')
  }

  const handleDeleteAccount = () => {
    toast.success('Account deletion initiated')
    setIsDeleteModalOpen(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={profile.avatar}
                  alt={profile.name}
                  fallback={profile.name.split(' ').map((n) => n[0]).join('')}
                  size="xl"
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{profile.name}</h3>
                <p className="text-sm text-slate-500">{profile.email}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Change Avatar
                </Button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Company
                </label>
                <Input
                  value={profile.company}
                  onChange={(e) => handleProfileChange('company', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Website
                </label>
                <Input
                  value={profile.website}
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bio
                </label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  className="mt-1.5 min-h-25"
                />
              </div>
            </div>

            {isDirty && (
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Email Notifications
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'emailNewComments', label: 'New comments on your posts' },
                  { key: 'emailPostPublished', label: 'Posts published successfully' },
                  { key: 'emailTeamActivity', label: 'Team member activity' },
                  { key: 'emailWeeklyReport', label: 'Weekly performance report' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                    <Switch
                      checked={(notifications as any)[item.key]}
                      onCheckedChange={(checked) => handleNotificationChange(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Push Notifications
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'pushNewComments', label: 'New comments on your posts' },
                  { key: 'pushPostPublished', label: 'Posts published successfully' },
                  { key: 'pushTeamActivity', label: 'Team member activity' },
                  { key: 'pushWeeklyReport', label: 'Weekly performance report' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                    <Switch
                      checked={(notifications as any)[item.key]}
                      onCheckedChange={(checked) => handleNotificationChange(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Theme</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map((theme) => {
                  const Icon = theme.icon
                  return (
                    <button
                      key={theme.value}
                      onClick={() => handleAppearanceChange('theme', theme.value)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-center transition-all',
                        appearance.theme === theme.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      )}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Language & Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Language
                </label>
                <Select
                  value={appearance.language}
                  onValueChange={(v) => handleAppearanceChange('language', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Timezone
                </label>
                <Select
                  value={appearance.timezone}
                  onValueChange={(v) => handleAppearanceChange('timezone', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date Format
                </label>
                <Select
                  value={appearance.dateFormat}
                  onValueChange={(v) => handleAppearanceChange('dateFormat', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Time Format
                </label>
                <Select
                  value={appearance.timeFormat}
                  onValueChange={(v) => handleAppearanceChange('timeFormat', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            {/* Password */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Key className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Password</p>
                      <p className="text-sm text-slate-500">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleChangePassword}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-slate-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        security.twoFactorEnabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={handleEnable2FA}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Timeout */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Session Timeout</p>
                    <p className="text-sm text-slate-500">
                      Automatically log out after period of inactivity
                    </p>
                  </div>
                  <Select
                    value={security.sessionTimeout}
                    onValueChange={(v) => setSecurity((prev) => ({ ...prev, sessionTimeout: v }))}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Delete Account</p>
                    <p className="text-sm text-slate-500">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <Card className="bg-linear-to-br from-indigo-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100">Current Plan</p>
                    <h3 className="text-2xl font-bold mt-1">Professional</h3>
                    <p className="text-indigo-100 mt-2">$29/month • Billed monthly</p>
                  </div>
                  <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Features */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Social Accounts', value: '10' },
                    { label: 'Scheduled Posts', value: 'Unlimited' },
                    { label: 'Team Members', value: '5' },
                    { label: 'Analytics History', value: '12 months' },
                  ].map((feature) => (
                    <div key={feature.label} className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">{feature.value}</p>
                      <p className="text-sm text-slate-500 mt-1">{feature.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-linear-to-r from-blue-500 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">•••• •••• •••• 4242</p>
                      <p className="text-sm text-slate-500">Expires 12/2025</p>
                    </div>
                  </div>
                  <Button variant="outline">Update</Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { date: 'Jan 1, 2024', amount: '$29.00', status: 'Paid' },
                    { date: 'Dec 1, 2023', amount: '$29.00', status: 'Paid' },
                    { date: 'Nov 1, 2023', amount: '$29.00', status: 'Paid' },
                  ].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{invoice.date}</p>
                        <p className="text-sm text-slate-500">{invoice.amount}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-100 text-emerald-700">{invoice.status}</Badge>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 sm:space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                    <ChevronRight className={cn(
                      'w-4 h-4 ml-auto transition-transform',
                      activeTab === tab.id && 'rotate-90'
                    )} />
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {tabs.find((t) => t.id === activeTab)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderTabContent()}</CardContent>
        </Card>
      </div>

      {/* Delete Account Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete your account? This action cannot be undone and will
              permanently delete all your data including:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>All scheduled and published posts</li>
              <li>Connected social accounts</li>
              <li>Analytics and performance data</li>
              <li>Team members and workspaces</li>
              <li>Media library contents</li>
            </ul>
            <Input placeholder="Type 'DELETE' to confirm" className="mt-4" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
