import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as analyticsService from '../services/analytics.service';

export const getWorkspaceAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { startDate, endDate } = req.query;

  const analytics = await analyticsService.getWorkspaceAnalytics(req.workspace.id, {
    startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: endDate ? new Date(endDate as string) : new Date(),
  });

  sendSuccess(res, { analytics }, 'Analytics retrieved');
});

export const getAccountAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const analytics = await analyticsService.getAccountAnalytics(accountId, {
    startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: endDate ? new Date(endDate as string) : new Date(),
  });

  if (!analytics) {
    return sendError(res, 'Account not found', 404);
  }

  sendSuccess(res, { analytics }, 'Account analytics retrieved');
});

export const syncAccountAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;

  await analyticsService.syncAccountAnalytics(accountId);

  sendSuccess(res, null, 'Analytics sync initiated');
});

export const getPostPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { startDate, endDate } = req.query;

  const performance = await analyticsService.getPostPerformanceAnalytics(req.workspace.id, {
    startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: endDate ? new Date(endDate as string) : new Date(),
  });

  sendSuccess(res, { performance }, 'Post performance retrieved');
});

export const getSnapshots = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { startDate, endDate } = req.query;

  const snapshots = await analyticsService.getAnalyticsSnapshots(req.workspace.id, {
    startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: endDate ? new Date(endDate as string) : new Date(),
  });

  sendSuccess(res, { snapshots }, 'Snapshots retrieved');
});

export const getBestTimes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const bestTimes = await analyticsService.getBestTimesToPost(req.workspace.id);

  sendSuccess(res, { bestTimes }, 'Best times retrieved');
});

export const createSnapshot = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  await analyticsService.createAnalyticsSnapshot(req.workspace.id);

  sendSuccess(res, null, 'Snapshot created');
});
