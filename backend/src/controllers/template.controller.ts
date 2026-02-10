import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as templateService from '../services/template.service';

export const getTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { category, search } = req.query;

  const templates = await templateService.getTemplates(req.workspace.id, {
    category: category as string | undefined,
    search: search as string | undefined,
  });

  sendSuccess(res, { templates }, 'Templates retrieved');
});

export const getTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const template = await templateService.getTemplateById(id);

  if (!template) {
    return sendError(res, 'Template not found', 404);
  }

  sendSuccess(res, { template }, 'Template retrieved');
});

export const createTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.workspace) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { name, description, content, category, platforms, tags, isPublic, metadata } = req.body;

  const template = await templateService.createTemplate(req.workspace.id, req.user.id, {
    name,
    description,
    content,
    category,
    platforms,
    tags,
    isPublic,
    metadata,
  });

  sendSuccess(res, { template }, 'Template created', 201);
});

export const updateTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const id = req.params.id as string;
  const { name, description, content, category, platforms, tags, isPublic, metadata } = req.body;

  const template = await templateService.updateTemplate(id, req.workspace.id, {
    name,
    description,
    content,
    category,
    platforms,
    tags,
    isPublic,
    metadata,
  });

  sendSuccess(res, { template }, 'Template updated');
});

export const deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const id = req.params.id as string;

  await templateService.deleteTemplate(id, req.workspace.id);

  sendSuccess(res, null, 'Template deleted');
});

export const useTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const template = await templateService.incrementUsageCount(id);

  sendSuccess(res, { template }, 'Template usage recorded');
});

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const categories = await templateService.getCategories(req.workspace.id);

  sendSuccess(res, { categories }, 'Categories retrieved');
});
