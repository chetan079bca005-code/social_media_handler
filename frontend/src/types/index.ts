// User Types
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  subscriptionTier: 'free' | 'pro' | 'business' | 'agency'
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  timezone: string
  notifications: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  postPublished: boolean
  postFailed: boolean
  approvalNeeded: boolean
  analyticsReport: boolean
}

// Workspace Types
export interface Workspace {
  id: string
  name: string
  ownerId: string
  logoUrl?: string
  settings: WorkspaceSettings
  subscriptionStatus: 'active' | 'inactive' | 'trial'
  createdAt: string
}

export interface WorkspaceSettings {
  brandColors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  logoUrl?: string
}

// Team Types
export interface TeamMember {
  id: string
  workspaceId: string
  userId: string
  user: User
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: TeamPermissions
  invitedAt: string
  joinedAt?: string
}

export interface TeamPermissions {
  createPosts: boolean
  publishPosts: boolean
  deletePosts: boolean
  manageTeam: boolean
  viewAnalytics: boolean
  manageBilling: boolean
  connectAccounts: boolean
}

// Social Account Types
export interface SocialAccount {
  id: string
  workspaceId: string
  platform: Platform
  accountName: string
  accountId: string
  accessToken: string
  refreshToken?: string
  profileImageUrl?: string
  followerCount: number
  connectedAt: string
  lastSyncedAt: string
  isActive: boolean
}

export type Platform = 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'linkedin' 
  | 'tiktok' 
  | 'youtube' 
  | 'pinterest' 
  | 'threads'

// Post Types
export interface Post {
  id: string
  workspaceId: string
  createdByUserId: string
  createdBy?: User
  status: PostStatus
  contentType: 'text' | 'image' | 'video' | 'carousel'
  caption: string
  mediaUrls: string[]
  scheduledAt?: string
  publishedAt?: string
  aiGenerated: boolean
  platformSpecificData: Record<string, unknown>
  platforms: PostPlatform[]
  hashtags: string[]
  mentions: string[]
  createdAt: string
  updatedAt: string
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'pending'

export interface PostPlatform {
  id: string
  postId: string
  socialAccountId: string
  socialAccount?: SocialAccount
  platformPostId?: string
  status: 'pending' | 'published' | 'failed'
  postedAt?: string
  engagementData?: EngagementData
  errorMessage?: string
}

export interface EngagementData {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  clicks: number
  saves: number
}

// Template Types
export interface ContentTemplate {
  id: string
  workspaceId: string
  name: string
  description?: string
  category: TemplateCategory
  templateData: TemplateData
  thumbnailUrl?: string
  isPublic: boolean
  useCount: number
  createdAt: string
}

export type TemplateCategory = 
  | 'product-launch'
  | 'announcement'
  | 'promotion'
  | 'educational'
  | 'quote'
  | 'behind-the-scenes'
  | 'testimonial'
  | 'event'
  | 'seasonal'
  | 'custom'

export interface TemplateData {
  structure: string
  prompts: Record<string, string>
  placeholders: string[]
  defaultValues: Record<string, string>
}

// AI Generation Types
export interface AIGeneration {
  id: string
  workspaceId: string
  userId: string
  type: 'text' | 'image' | 'video' | 'audio'
  prompt: string
  generatedContent: string | string[]
  modelUsed: string
  cost?: number
  createdAt: string
}

export interface AITextGenerationRequest {
  topic: string
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'
  platform: Platform
  length: 'short' | 'medium' | 'long'
  keywords?: string[]
  includeHashtags?: boolean
  includeEmojis?: boolean
  includeCTA?: boolean
}

export interface AIImageGenerationRequest {
  prompt: string
  style: 'realistic' | 'cartoon' | 'abstract' | 'minimalist' | '3d'
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5'
  platform?: Platform
}

// Analytics Types
export interface Analytics {
  id: string
  postId: string
  socialAccountId: string
  date: string
  impressions: number
  reach: number
  engagement: number
  likes: number
  comments: number
  shares: number
  clicks: number
  saves: number
  fetchedAt: string
}

export interface AnalyticsSummary {
  totalImpressions: number
  totalEngagement: number
  engagementRate: number
  followerGrowth: number
  clickThroughRate: number
  topPlatform: Platform
  bestPostingTime: string
  impressionsChange: number
  engagementChange: number
}

export interface PlatformAnalytics {
  platform: Platform
  impressions: number
  engagement: number
  followers: number
  posts: number
}

// Media Library Types
export interface MediaItem {
  id: string
  workspaceId: string
  filename: string
  fileUrl: string
  thumbnailUrl?: string
  fileType: 'image' | 'video' | 'audio' | 'document'
  fileSize: number
  width?: number
  height?: number
  duration?: number
  tags: string[]
  altText?: string
  uploadedBy: string
  uploadedAt: string
  usageCount: number
}

// Approval Workflow Types
export interface ApprovalWorkflow {
  id: string
  workspaceId: string
  postId: string
  post?: Post
  status: 'pending' | 'approved' | 'rejected'
  approverId?: string
  approver?: User
  reviewedAt?: string
  comments?: string
  createdAt: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: string
}

export type NotificationType = 
  | 'post_published'
  | 'post_failed'
  | 'approval_needed'
  | 'team_comment'
  | 'scheduled_reminder'
  | 'analytics_milestone'
  | 'competitor_post'
  | 'credits_low'
  | 'subscription_renewal'
  | 'team_joined'

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Calendar Types
export interface CalendarEvent {
  id: string
  title: string
  start: Date | string
  end?: Date | string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps: {
    post: Post
    platform: Platform[]
    status: PostStatus
  }
}

// Dashboard Types
export interface DashboardStats {
  totalPosts: number
  scheduledPosts: number
  publishedPosts: number
  engagementRate: number
  followerGrowth: number
  totalFollowers: number
  postsThisWeek: number
  postsChange: number
}

export interface RecentActivity {
  id: string
  type: 'post_created' | 'post_published' | 'account_connected' | 'team_joined'
  description: string
  timestamp: string
  userId: string
  user?: User
}
