import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Clock,
  CheckCircle2,
  BarChart3,
  Users,
  Image,
  LayoutTemplate,
  UsersRound,
  Settings,
  ChevronLeft,
  Sparkles,
  Inbox,
  Hash,
  Palette,
  Film,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUIStore } from '../../store'

interface SidebarProps {
  onClose?: () => void
  isMobile?: boolean
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Content Calendar', path: '/calendar' },
  { icon: PlusCircle, label: 'Create Post', path: '/create' },
  { icon: Palette, label: 'Design Studio', path: '/design-studio' },
  { icon: Film, label: 'Video Studio', path: '/video-studio' },
  { icon: Clock, label: 'Scheduled', path: '/scheduled' },
  { icon: CheckCircle2, label: 'Published', path: '/published' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Users, label: 'Social Accounts', path: '/accounts' },
  { icon: Inbox, label: 'Inbox', path: '/inbox' },
  { icon: Image, label: 'Media Library', path: '/media' },
  { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
  { icon: Hash, label: 'Hashtags', path: '/hashtags' },
  { icon: Sparkles, label: 'AI Studio', path: '/ai-studio' },
  { icon: UsersRound, label: 'Team', path: '/team' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function Sidebar({ onClose, isMobile }: SidebarProps) {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  // On desktop collapsed state, we show a slim sidebar with icon-only + hover tooltip
  const isCollapsed = !isMobile && sidebarCollapsed

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden',
        'transition-[width] duration-300 ease-in-out',
        isCollapsed ? 'w-18' : 'w-65'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <Link to="/" className="flex items-center gap-3 min-w-0" onClick={handleNavClick}>
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span
            className={cn(
              'text-xl font-bold bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent whitespace-nowrap',
              'transition-all duration-300 ease-in-out',
              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
            )}
          >
            SocialHub
          </span>
        </Link>
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <li key={item.path} className="relative group">
                <Link
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg transition-all duration-200 relative',
                    isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-linear-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-linear-to-b from-indigo-500 to-purple-600 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive && 'text-indigo-500'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden',
                      isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip on hover when collapsed — pure CSS, no focus/click issues */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-r-[6px] border-r-slate-900 dark:border-r-slate-100 border-b-[5px] border-b-transparent" />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Button - hidden on mobile */}
      {!isMobile && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden',
                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
              )}
            >
              Collapse
            </span>
          </button>
        </div>
      )}
    </aside>
  )
}
