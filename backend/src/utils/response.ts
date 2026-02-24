import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

// Success response
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
}

// Success with pagination
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      hasMore: pagination.page < pagination.totalPages,
    },
    message,
  };
  return res.status(200).json(response);
}

// Error response
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Array<{ field: string; message: string }>
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

// Not found response
export function sendNotFound(res: Response, resource: string = 'Resource'): Response {
  return sendError(res, `${resource} not found`, 404);
}

// Unauthorized response
export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

// Forbidden response
export function sendForbidden(res: Response, message: string = 'Forbidden'): Response {
  return sendError(res, message, 403);
}

// Validation error response
export function sendValidationError(
  res: Response,
  errors: Array<{ field: string; message: string }>
): Response {
  return sendError(res, 'Validation failed', 422, errors);
}

// Server error response
export function sendServerError(res: Response, error?: Error): Response {
  console.error('Server error:', error);
  return sendError(
    res,
    process.env.NODE_ENV === 'development' && error
      ? error.message
      : 'Internal server error',
    500
  );
}

// Calculate pagination meta
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

// Parse pagination from query
export function parsePaginationQuery(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

// Generate slug from string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate unique slug
export async function generateUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 0;
  
  while (await checkExists(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}
