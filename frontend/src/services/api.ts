import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore, useWorkspaceStore } from '../store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============ Retry Configuration ============
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000 // 1s base delay (doubles each retry)

// Errors that are safe to retry (idempotent or transient)
function isRetryable(error: AxiosError): boolean {
  // Network errors (no response received)
  if (!error.response) {
    // Timeout, connection refused, DNS failure, network offline
    return (
      error.code === 'ECONNABORTED' || // timeout
      error.code === 'ERR_NETWORK' ||  // network error
      error.code === 'ECONNREFUSED' || // server not running
      error.code === 'ECONNRESET' ||   // connection reset
      error.code === 'ETIMEDOUT' ||    // TCP timeout
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error')
    )
  }
  // Server errors (5xx) are retryable
  const status = error.response.status
  return status >= 500 && status !== 501
}

// Which HTTP methods are safe to retry
function isIdempotent(method?: string): boolean {
  const m = (method || '').toUpperCase()
  return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(m)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============ User-friendly error messages ============
function getErrorMessage(error: AxiosError): string {
  // Server provided error message
  const serverMsg = (error.response?.data as any)?.error || (error.response?.data as any)?.message
  if (serverMsg && typeof serverMsg === 'string') return serverMsg

  // Network/timeout errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Server is taking too long to respond. Please check your connection and try again.'
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Unable to reach the server. Please check if the backend is running and your internet connection.'
    }
    return 'Connection failed. Please check your network and try again.'
  }

  // HTTP status-based messages
  const status = error.response.status
  switch (status) {
    case 400: return serverMsg || 'Invalid request. Please check your input.'
    case 401: return serverMsg || 'Session expired. Please log in again.'
    case 403: return 'You don\'t have permission to perform this action.'
    case 404: return 'The requested resource was not found.'
    case 409: return serverMsg || 'This resource already exists.'
    case 413: return 'File is too large to upload.'
    case 422: return serverMsg || 'Invalid data provided.'
    case 429: return 'Too many requests. Please wait a moment and try again.'
    case 500: return 'Server error. Please try again in a moment.'
    case 502: return 'Server is temporarily unavailable. Please try again.'
    case 503: return 'Service is temporarily down for maintenance.'
    default: return serverMsg || `Request failed (${status}). Please try again.`
  }
}

// Request interceptor to add auth token and workspace ID
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add workspace ID header for workspace-scoped requests
    const workspace = useWorkspaceStore.getState().currentWorkspace
    if (workspace?.id) {
      config.headers['x-workspace-id'] = workspace.id
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (error?: unknown) => void }> = []

const processQueue = (error: unknown = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
  failedQueue = []
}

// Response interceptor for error handling with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // NEVER attempt token refresh for auth endpoints — a 401 on login/register
    // means invalid credentials, not an expired token.
    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh the token using httpOnly cookie
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken = response.data?.data?.accessToken

        if (newToken) {
          useAuthStore.getState().setToken(newToken)
          processQueue()
          // Retry the original request with new token
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` }
          return api(originalRequest)
        }
      } catch {
        processQueue(error)
      } finally {
        isRefreshing = false
      }

      // Refresh failed — logout
      useAuthStore.getState().logout()
      // Clear SWR cache on logout
      try { const { clearAllCache } = await import('../lib/useDataCache'); clearAllCache() } catch {}
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Generic request wrapper with automatic retry for transient failures
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const method = config.method || 'GET'
  const isAuthRoute = config.url?.includes('/auth/')
  const retries = isIdempotent(method) ? MAX_RETRIES : (method.toUpperCase() === 'POST' && isAuthRoute ? 1 : 0)

  // Auth routes get longer timeout (DB may need to warm up on first request)
  if (isAuthRoute && !config.timeout) {
    config.timeout = 30000 // 30s for auth (login/register may trigger DB cold start)
  }

  let lastError: AxiosError | Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await api(config)
      return response.data
    } catch (error) {
      lastError = error as AxiosError | Error

      // Only retry on retryable errors and if we have attempts left
      if (
        attempt < retries &&
        axios.isAxiosError(error) &&
        isRetryable(error)
      ) {
        const wait = RETRY_DELAY_MS * Math.pow(2, attempt)
        console.warn(`Request to ${config.url} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${wait}ms...`)
        await delay(wait)
        continue
      }

      // Not retryable or out of retries — throw user-friendly error
      if (axios.isAxiosError(error)) {
        throw new Error(getErrorMessage(error))
      }
      throw error
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Request failed')
}

// ============ Backend health check / connection warmup ============
let backendStatus: 'unknown' | 'warming' | 'ready' = 'unknown'

export function getBackendStatus() {
  return backendStatus
}

export async function warmupBackend(): Promise<boolean> {
  if (backendStatus === 'ready') return true
  backendStatus = 'warming'

  // Try up to 3 times with increasing timeout (handles Atlas cold start)
  for (let i = 0; i < 3; i++) {
    try {
      const timeout = 5000 + i * 5000 // 5s, 10s, 15s
      const res = await axios.get(`${API_URL}/health`, { timeout })
      if (res.data?.status === 'ok') {
        backendStatus = 'ready'
        return true
      }
      // Server is up but DB still warming — wait and retry
      await delay(2000)
    } catch {
      // Server not reachable or timed out — wait and retry
      if (i < 2) await delay(2000)
    }
  }
  backendStatus = 'unknown'
  return false
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { user: any; accessToken: string; workspaces: any[] } }>({
      method: 'POST',
      url: '/auth/login',
      data: { email, password },
    }),

  register: (data: { email: string; password: string; name: string }) =>
    request<{ success: boolean; data: { user: any; accessToken: string; workspace: any; workspaces: any[] } }>({
      method: 'POST',
      url: '/auth/register',
      data,
    }),

  logout: () =>
    request<void>({
      method: 'POST',
      url: '/auth/logout',
    }),

  me: () =>
    request<{ success: boolean; data: { user: any } }>({
      method: 'GET',
      url: '/auth/me',
    }),

  forgotPassword: (email: string) =>
    request<void>({
      method: 'POST',
      url: '/auth/password-reset/request',
      data: { email },
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<void>({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      data: { token, newPassword },
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>({
      method: 'POST',
      url: '/auth/change-password',
      data: { currentPassword, newPassword },
    }),

  googleAuth: (data: { email: string; name: string; googleSub: string }) =>
    request<{ success: boolean; data: { user: any; accessToken: string; workspace?: any; workspaces: any[] } }>({
      method: 'POST',
      url: '/auth/google',
      data,
    }),
}

// User API
export const userApi = {
  getProfile: () =>
    request<{ success: boolean; data: { user: any } }>({
      method: 'GET',
      url: '/users/profile',
    }),

  updateProfile: (data: { name?: string; avatarUrl?: string; timezone?: string; language?: string }) =>
    request<{ success: boolean; data: { user: any } }>({
      method: 'PATCH',
      url: '/users/profile',
      data,
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return request<{ success: boolean; data: { user: any; avatarUrl: string } }>({
      method: 'POST',
      url: '/users/profile/avatar',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updatePreferences: (preferences: Record<string, unknown>) =>
    request<{ success: boolean; data: { user: any } }>({
      method: 'PATCH',
      url: '/users/preferences',
      data: preferences,
    }),

  deleteAccount: () =>
    request<{ success: boolean }>({
      method: 'DELETE',
      url: '/users/account',
    }),
}

// Posts API
export const postsApi = {
  getAll: (params?: Record<string, any>) =>
    request<{ data: any[]; total: number }>({
      method: 'GET',
      url: '/posts',
      params,
    }),

  getById: (id: string) =>
    request<any>({
      method: 'GET',
      url: `/posts/${id}`,
    }),

  create: (data: any) =>
    request<any>({
      method: 'POST',
      url: '/posts',
      data,
    }),

  update: (id: string, data: any) =>
    request<any>({
      method: 'PATCH',
      url: `/posts/${id}`,
      data,
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/posts/${id}`,
    }),

  schedule: (id: string, scheduledAt: string) =>
    request<any>({
      method: 'POST',
      url: `/posts/${id}/schedule`,
      data: { scheduledAt },
    }),

  publish: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/posts/${id}/publish`,
    }),

  duplicate: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/posts/${id}/duplicate`,
    }),
}

// Social Accounts API
export const socialAccountsApi = {
  getAll: (workspaceId: string) =>
    request<{ success: boolean; data: { accounts: any[] } }>({
      method: 'GET',
      url: `/social-accounts/workspace/${workspaceId}`,
    }),

  getOAuthUrl: (workspaceId: string, platform: string) =>
    request<{ success: boolean; data: { authUrl: string } }>({
      method: 'GET',
      url: `/social-accounts/workspace/${workspaceId}/oauth/${platform}`,
    }),

  connect: (workspaceId: string, data: {
    platform: string;
    platformAccountId: string;
    accessToken: string;
    refreshToken?: string;
    accountName: string;
    accountUsername?: string;
  }) =>
    request<{ success: boolean; data: { account: any } }>({
      method: 'POST',
      url: `/social-accounts/workspace/${workspaceId}`,
      data,
    }),

  disconnect: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/social-accounts/${id}`,
    }),

  refresh: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/social-accounts/${id}/refresh-token`,
    }),

  sync: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/social-accounts/${id}/sync`,
    }),

  update: (id: string, data: any) =>
    request<any>({
      method: 'PATCH',
      url: `/social-accounts/${id}`,
      data,
    }),
}

// Analytics API
export const analyticsApi = {
  getWorkspaceAnalytics: (workspaceId: string, params?: { startDate?: string; endDate?: string }) =>
    request<{ success: boolean; data: { analytics: any } }>({
      method: 'GET',
      url: `/analytics/workspace/${workspaceId}`,
      params,
    }),

  getPostPerformance: (workspaceId: string, params?: { startDate?: string; endDate?: string }) =>
    request<{ success: boolean; data: { performance: any } }>({
      method: 'GET',
      url: `/analytics/workspace/${workspaceId}/posts`,
      params,
    }),

  getBestTimes: (workspaceId: string) =>
    request<{ success: boolean; data: { bestTimes: any } }>({
      method: 'GET',
      url: `/analytics/workspace/${workspaceId}/best-times`,
    }),

  getSnapshots: (workspaceId: string, params?: { startDate?: string; endDate?: string }) =>
    request<{ success: boolean; data: { snapshots: any[] } }>({
      method: 'GET',
      url: `/analytics/workspace/${workspaceId}/snapshots`,
      params,
    }),

  getAccountAnalytics: (accountId: string, params?: { startDate?: string; endDate?: string }) =>
    request<any>({
      method: 'GET',
      url: `/analytics/accounts/${accountId}`,
      params,
    }),
}

// Media API
export const mediaApi = {
  getAll: (workspaceId: string, params?: { type?: string; page?: number; limit?: number; search?: string; folderId?: string | null }) =>
    request<{ data: any[]; pagination?: { total?: number } }>({
      method: 'GET',
      url: `/media/workspace/${workspaceId}`,
      params,
    }),

  upload: (workspaceId: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    return request<any>({
      method: 'POST',
      url: `/media/workspace/${workspaceId}/upload`,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/media/${id}`,
    }),

  update: (id: string, data: { tags?: string[]; altText?: string }) =>
    request<any>({
      method: 'PATCH',
      url: `/media/${id}`,
      data,
    }),

  getFolders: (workspaceId: string) =>
    request<{ success: boolean; data: { folders: any[] } }>({
      method: 'GET',
      url: `/media/workspace/${workspaceId}/folders`,
    }),

  createFolder: (workspaceId: string, data: { name: string; parentId?: string }) =>
    request<any>({
      method: 'POST',
      url: `/media/workspace/${workspaceId}/folders`,
      data,
    }),
}

// Templates API
export const templatesApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    request<{ success: boolean; data: { templates: any[] } }>({
      method: 'GET',
      url: '/templates',
      params,
    }),

  getById: (id: string) =>
    request<{ success: boolean; data: { template: any } }>({
      method: 'GET',
      url: `/templates/${id}`,
    }),

  create: (data: any) =>
    request<{ success: boolean; data: { template: any } }>({
      method: 'POST',
      url: '/templates',
      data,
    }),

  update: (id: string, data: any) =>
    request<{ success: boolean; data: { template: any } }>({
      method: 'PATCH',
      url: `/templates/${id}`,
      data,
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/templates/${id}`,
    }),

  use: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/templates/${id}/use`,
    }),

  getCategories: () =>
    request<{ success: boolean; data: { categories: string[] } }>({
      method: 'GET',
      url: '/templates/categories',
    }),
}

// Team API (uses workspace member endpoints)
export const teamApi = {
  getMembers: (workspaceId: string) =>
    request<{ success: boolean; data: { members: any[] } }>({
      method: 'GET',
      url: `/workspaces/${workspaceId}/members`,
    }),

  invite: (workspaceId: string, email: string, role: string) =>
    request<{ success: boolean; data: { invitation: any } }>({
      method: 'POST',
      url: `/workspaces/${workspaceId}/members/invite`,
      data: { email, role: role.toUpperCase() },
    }),

  updateRole: (workspaceId: string, memberId: string, role: string) =>
    request<{ success: boolean; data: { member: any } }>({
      method: 'PATCH',
      url: `/workspaces/${workspaceId}/members/${memberId}/role`,
      data: { role: role.toUpperCase() },
    }),

  removeMember: (workspaceId: string, memberId: string) =>
    request<void>({
      method: 'DELETE',
      url: `/workspaces/${workspaceId}/members/${memberId}`,
    }),
}

// Workspaces API
export const workspacesApi = {
  getAll: () =>
    request<{ workspaces: any[] }>({
      method: 'GET',
      url: '/workspaces',
    }),

  create: (data: { name: string }) =>
    request<any>({
      method: 'POST',
      url: '/workspaces',
      data,
    }),

  update: (id: string, data: any) =>
    request<any>({
      method: 'PATCH',
      url: `/workspaces/${id}`,
      data,
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/workspaces/${id}`,
    }),
}

// Notifications API (correct path: /users/notifications)
export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean }) =>
    request<{ success: boolean; data: any[] }>({
      method: 'GET',
      url: '/users/notifications',
      params,
    }),

  markAsRead: (id: string) =>
    request<void>({
      method: 'PATCH',
      url: `/users/notifications/${id}/read`,
    }),

  markAllAsRead: () =>
    request<void>({
      method: 'PATCH',
      url: '/users/notifications/read-all',
    }),

  delete: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/users/notifications/${id}`,
    }),
}

// Global Search API
export const searchApi = {
  search: (query: string, limit?: number) =>
    request<{ success: boolean; data: { results: any[]; total: number; query: string } }>({
      method: 'GET',
      url: '/search',
      params: { q: query, limit },
    }),
}

export default api
