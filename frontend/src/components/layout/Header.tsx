import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Building2,
  Menu,
  FileText,
  Image,
  Loader2,
  X,
  Hash,
  AtSign,
} from 'lucide-react'
import { useAuthStore, useUIStore, useNotificationsStore, useWorkspaceStore } from '../../store'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import { Input } from '../ui/Input'
import { searchApi, notificationsApi } from '../../services/api'

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const { unreadCount, notifications, setNotifications, markAsRead, markAllAsRead: markAllReadLocal } = useNotificationsStore()
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    searchTimerRef.current = setTimeout(async () => {
      try {
        const response = await searchApi.search(query, 15)
        setSearchResults(response?.data?.results || [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load notifications on mount
  useEffect(() => {
    notificationsApi.getAll().then((res: any) => {
      const notifs = res?.data || []
      setNotifications(notifs.map((n: any) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        read: n.isRead,
        createdAt: n.createdAt,
      })))
    }).catch(() => {})
  }, [setNotifications])

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      markAllReadLocal()
    } catch {}
  }

  const handleNotificationClick = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      markAsRead(id)
    } catch {}
  }

  const navigateToResult = (result: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    switch (result.type) {
      case 'post':
        navigate('/scheduled')
        break
      case 'template':
        navigate('/templates')
        break
      case 'media':
        navigate('/media')
        break
      case 'social_account':
        navigate('/accounts')
        break
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4 text-indigo-500" />
      case 'template': return <Hash className="w-4 h-4 text-purple-500" />
      case 'media': return <Image className="w-4 h-4 text-pink-500" />
      case 'social_account': return <AtSign className="w-4 h-4 text-blue-500" />
      default: return <Search className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile menu button */}
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden text-slate-600 dark:text-slate-400 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search posts, templates, media..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              className="pl-10 pr-8 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearchResults(false); setSearchResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((result, i) => (
                      <button
                        key={`${result.type}-${result.id}-${i}`}
                        onClick={() => navigateToResult(result)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="shrink-0">{getResultIcon(result.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{result.title}</p>
                          <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                        </div>
                        <Badge variant="secondary" size="sm" className="shrink-0 capitalize text-[10px]">
                          {result.type.replace('_', ' ')}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    <Search className="w-5 h-5 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile search */}
        {mobileSearchOpen && (
          <div className="absolute inset-x-0 top-0 h-16 bg-white dark:bg-slate-900 z-40 px-3 flex items-center gap-2 sm:hidden">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Mobile search icon */}
        <Button variant="ghost" size="icon" className="sm:hidden text-slate-600 dark:text-slate-400" onClick={() => setMobileSearchOpen(true)}>
          <Search className="w-5 h-5" />
        </Button>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Workspace Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                <Building2 className="w-4 h-4" />
                <span className="hidden md:inline max-w-37.5 truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setCurrentWorkspace(workspace)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {workspace.name[0]}
                    </div>
                    <span>{workspace.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings/workspaces" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Workspaces
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-slate-600 dark:text-slate-400"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-600 dark:text-slate-400"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllRead}>
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-75 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      <p className={`text-sm ${!notif.read ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/inbox" className="cursor-pointer justify-center">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 dark:text-slate-400"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 pl-2 pr-3"
              >
                <Avatar
                  src={user?.avatarUrl}
                  alt={user?.name || 'User'}
                  size="sm"
                />
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name || 'User'}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
