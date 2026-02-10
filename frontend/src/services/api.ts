import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore, useWorkspaceStore } from '../store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Generic request wrapper
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api(config)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || error.message)
    }
    throw error
  }
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
      method: 'PUT',
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
  getAll: () =>
    request<any[]>({
      method: 'GET',
      url: '/social-accounts',
    }),

  connect: (platform: string) =>
    request<{ authUrl: string }>({
      method: 'POST',
      url: '/social-accounts/connect',
      data: { platform },
    }),

  callback: (platform: string, code: string) =>
    request<any>({
      method: 'POST',
      url: '/social-accounts/callback',
      data: { platform, code },
    }),

  disconnect: (id: string) =>
    request<void>({
      method: 'DELETE',
      url: `/social-accounts/${id}`,
    }),

  refresh: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/social-accounts/${id}/refresh`,
    }),

  sync: (id: string) =>
    request<any>({
      method: 'POST',
      url: `/social-accounts/${id}/sync`,
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
      method: 'PUT',
      url: `/media/${id}`,
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
      method: 'PUT',
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

// Notifications API
export const notificationsApi = {
  getAll: () =>
    request<any[]>({
      method: 'GET',
      url: '/notifications',
    }),

  markAsRead: (id: string) =>
    request<void>({
      method: 'PUT',
      url: `/notifications/${id}/read`,
    }),

  markAllAsRead: () =>
    request<void>({
      method: 'PUT',
      url: '/notifications/read-all',
    }),
}

export default api
