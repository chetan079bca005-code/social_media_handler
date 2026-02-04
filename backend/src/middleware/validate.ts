import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

// Validate request body
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendValidationError(res, errors);
      }
      throw error;
    }
  };
}

// Validate request query
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendValidationError(res, errors);
      }
      throw error;
    }
  };
}

// Validate request params
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendValidationError(res, errors);
      }
      throw error;
    }
  };
}
