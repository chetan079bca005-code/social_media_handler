import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronRight,
  Sparkles,
  Inbox,
  Hash,
  Palette,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUIStore } from '../../store'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/Tooltip'

interface SidebarProps {
  onClose?: () => void
  isMobile?: boolean
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Content Calendar', path: '/calendar' },
  { icon: PlusCircle, label: 'Create Post', path: '/create' },
  { icon: Palette, label: 'Design Studio', path: '/design-studio' },
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

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: isMobile ? 260 : (sidebarCollapsed ? 80 : 260) }}
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <Link to="/" className="flex items-center gap-3" onClick={handleNavClick}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {(isMobile || !sidebarCollapsed) && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xl font-bold bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
                >
                  SocialHub
                </motion.span>
              )}
            </AnimatePresence>
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
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              return (
                <li key={item.path}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                          isActive
                            ? 'bg-linear-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-linear-to-b from-indigo-500 to-purple-600 rounded-r-full"
                          />
                        )}
                        <Icon
                          className={cn(
                            'w-5 h-5 shrink-0 transition-colors',
                            isActive && 'text-indigo-500'
                          )}
                        />
                        <AnimatePresence>
                          {(isMobile || !sidebarCollapsed) && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="text-sm font-medium whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    {!isMobile && sidebarCollapsed && (
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse Button - hidden on mobile */}
        {!isMobile && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.aside>
    </TooltipProvider>
  )
}
