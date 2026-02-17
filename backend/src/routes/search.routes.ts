import { Router } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth';
import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import * as searchService from '../services/search.service';

const router = Router();

router.use(authenticate);

// Global search across workspace
router.get('/', requireWorkspace(), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendSuccess(res, { results: [], total: 0, query: '' }, 'Search complete');
  }

  const query = (req.query.q as string) || '';
  const limit = parseInt(req.query.limit as string) || 20;

  const results = await searchService.globalSearch(req.workspace.id, query, limit);

  sendSuccess(res, results, 'Search complete');
}));

export default router;
