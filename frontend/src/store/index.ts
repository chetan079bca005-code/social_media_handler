import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Workspace, SocialAccount, Post, Notification } from '../types'

// Auth Store
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (isLoading: boolean) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      login: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return
        }
        // If there's a stored token, keep isLoading=true so route guards
        // wait for initializeAuth to verify the token with the server.
        // Do NOT set isAuthenticated here — stale tokens must be verified first.
        if (state.token) {
          // Keep isLoading = true (default) — initializeAuth will set it false
          return
        }
        // No token → definitely not authenticated
        state.setLoading(false)
      },
    }
  )
)

// Workspace Store
interface WorkspaceState {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  addWorkspace: (workspace: Workspace) => void
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      workspaces: [],
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      addWorkspace: (workspace) =>
        set((state) => ({ workspaces: [...state.workspaces, workspace] })),
      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
          currentWorkspace:
            state.currentWorkspace?.id === id
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        })),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ currentWorkspace: state.currentWorkspace }),
    }
  )
)

// Social Accounts Store
interface SocialAccountsState {
  accounts: SocialAccount[]
  isLoading: boolean
  setAccounts: (accounts: SocialAccount[]) => void
  addAccount: (account: SocialAccount) => void
  removeAccount: (id: string) => void
  updateAccount: (id: string, updates: Partial<SocialAccount>) => void
  getAccountsByPlatform: (platform: string) => SocialAccount[]
}

export const useSocialAccountsStore = create<SocialAccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),
  removeAccount: (id) =>
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  getAccountsByPlatform: (platform) =>
    get().accounts.filter((a) => a.platform === platform),
}))

// Posts Store
interface PostsState {
  posts: Post[]
  selectedPost: Post | null
  isLoading: boolean
  filters: {
    status: string | null
    platform: string | null
    dateRange: { start: Date | null; end: Date | null }
  }
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  deletePost: (id: string) => void
  setSelectedPost: (post: Post | null) => void
  setFilters: (filters: Partial<PostsState['filters']>) => void
  clearFilters: () => void
}

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],
  selectedPost: null,
  isLoading: false,
  filters: {
    status: null,
    platform: null,
    dateRange: { start: null, end: null },
  },
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      selectedPost:
        state.selectedPost?.id === id
          ? { ...state.selectedPost, ...updates }
          : state.selectedPost,
    })),
  deletePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
      selectedPost: state.selectedPost?.id === id ? null : state.selectedPost,
    })),
  setSelectedPost: (post) => set({ selectedPost: post }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () =>
    set({
      filters: {
        status: null,
        platform: null,
        dateRange: { start: null, end: null },
      },
    }),
}))

// UI Store
interface UIState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  isMobile: boolean
  activeModal: string | null
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setIsMobile: (isMobile: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      isMobile: false,
      activeModal: null,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      setIsMobile: (isMobile) => set({ isMobile }),
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

// Notifications Store
interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      const wasUnread = notification && !notification.read
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))

// AI Generation Store
interface AIGenerationState {
  isGenerating: boolean
  generationType: 'text' | 'image' | 'video' | 'audio' | null
  generatedContent: string | string[] | null
  error: string | null
  setIsGenerating: (isGenerating: boolean, type?: 'text' | 'image' | 'video' | 'audio' | null) => void
  setGeneratedContent: (content: string | string[] | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAIGenerationStore = create<AIGenerationState>((set) => ({
  isGenerating: false,
  generationType: null,
  generatedContent: null,
  error: null,
  setIsGenerating: (isGenerating, type = null) =>
    set({ isGenerating, generationType: type }),
  setGeneratedContent: (content) =>
    set({ generatedContent: content, isGenerating: false }),
  setError: (error) => set({ error, isGenerating: false }),
  reset: () =>
    set({
      isGenerating: false,
      generationType: null,
      generatedContent: null,
      error: null,
    }),
}))
