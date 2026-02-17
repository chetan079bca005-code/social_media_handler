import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getCharacterLimit(platform: string): number {
  const limits: Record<string, number> = {
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
    tiktok: 2200,
    youtube: 5000,
    pinterest: 500,
    threads: 500,
  }
  return limits[platform.toLowerCase()] || 2200
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    twitter: '#000000',
    linkedin: '#0A66C2',
    tiktok: '#00F2EA',
    youtube: '#FF0000',
    pinterest: '#E60023',
    threads: '#000000',
  }
  return colors[platform.toLowerCase()] || '#6366F1'
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'facebook' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram' },
  { id: 'twitter', name: 'Twitter / X', color: '#000000', icon: 'twitter' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: 'linkedin' },
  { id: 'tiktok', name: 'TikTok', color: '#00F2EA', icon: 'music' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'youtube' },
  { id: 'pinterest', name: 'Pinterest', color: '#E60023', icon: 'pin' },
  { id: 'threads', name: 'Threads', color: '#000000', icon: 'at-sign' },
] as const

export type Platform = typeof PLATFORMS[number]['id']

export const POST_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-500' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500' },
  published: { label: 'Published', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
  pending: { label: 'Pending Approval', color: 'bg-yellow-500' },
} as const

export type PostStatus = keyof typeof POST_STATUS
