import { Request, Response, NextFunction } from 'express';
import { User, Workspace, WorkspaceRole } from '@prisma/client';

// Extended Express Request with user
export interface AuthRequest extends Request {
  user?: User & {
    workspaces?: {
      workspace: Workspace;
      role: WorkspaceRole;
    }[];
  };
  workspace?: Workspace;
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  pagination?: PaginationMeta;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Controller type
export type AsyncController = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// Token types
export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Social Platform types
export interface SocialAuthResult {
  platformAccountId: string;
  accountName: string;
  accountUsername?: string;
  profileImageUrl?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  metadata?: Record<string, unknown>;
}

// Post Publishing types
export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  errorMessage?: string;
}

// AI Service types
export interface AIGenerationRequest {
  prompt: string;
  platform?: string;
  tone?: string;
  language?: string;
  maxLength?: number;
}

export interface AIGenerationResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Analytics types
export interface AnalyticsQuery {
  startDate: Date;
  endDate: Date;
  platform?: string;
  granularity?: 'day' | 'week' | 'month';
}

export interface AnalyticsData {
  date: Date;
  followers: number;
  engagement: number;
  impressions: number;
  reach: number;
  posts: number;
}

// File Upload types
export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Job types
export interface JobData {
  type: string;
  payload: Record<string, unknown>;
  scheduledAt?: Date;
}

// WebSocket events
export type WSEventType = 
  | 'post:published'
  | 'post:failed'
  | 'notification:new'
  | 'analytics:updated'
  | 'account:connected'
  | 'account:disconnected';

export interface WSEvent {
  type: WSEventType;
  data: unknown;
  userId?: string;
  workspaceId?: string;
}
