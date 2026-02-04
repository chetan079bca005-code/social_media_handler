import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, requireWorkspace, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Workspace analytics
router.get('/workspace/:workspaceId', requireWorkspace(), analyticsController.getWorkspaceAnalytics);
router.get('/workspace/:workspaceId/posts', requireWorkspace(), analyticsController.getPostPerformance);
router.get('/workspace/:workspaceId/best-times', requireWorkspace(), analyticsController.getBestTimes);
router.get('/workspace/:workspaceId/snapshots', requireWorkspace(), analyticsController.getSnapshots);
router.post('/workspace/:workspaceId/snapshots', requireWorkspace(['OWNER', 'ADMIN']), analyticsController.createSnapshot);

// Account analytics
router.get('/accounts/:accountId', analyticsController.getAccountAnalytics);
router.post('/accounts/:accountId/sync', analyticsController.syncAccountAnalytics);

export default router;
