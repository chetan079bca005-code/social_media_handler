import { Request, Response, NextFunction } from 'express';
import { sendError, sendServerError } from '../utils/response';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found handler
export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}

// Global error handler
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response {
  console.error('Error:', error);

  // Handle known operational errors
  if (error instanceof AppError) {
    return sendError(res, error.message, error.statusCode);
  }

  // Handle Prisma errors (SQL + MongoDB)
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as { code?: string; meta?: { target?: string[] | string } };

    if (prismaError.code === 'P2002') {
      const target = Array.isArray(prismaError.meta?.target)
        ? prismaError.meta?.target?.[0]
        : (prismaError.meta?.target as string | undefined);
      return sendError(res, `A record with this ${target || 'field'} already exists`, 409);
    }

    if (prismaError.code === 'P2025') {
      return sendError(res, 'Record not found', 404);
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return sendError(res, error.message, 422);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Default server error
  return sendServerError(res, error);
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
