import { Router } from 'express';
import { z } from 'zod';
import * as socialAccountController from '../controllers/social-account.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace, requireRole } from '../middleware/auth';

const router = Router();

// Validation schemas
const connectAccountSchema = z.object({
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'PINTEREST', 'THREADS']),
  platformAccountId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  accountName: z.string().min(1),
  accountUsername: z.string().optional(),
  accountAvatarUrl: z.string().url().optional(),
});

const updateAccountSchema = z.object({
  accountName: z.string().min(1).optional(),
  accountUsername: z.string().optional(),
  accountAvatarUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

// OAuth callback - no auth required
router.get('/callback/:platform', socialAccountController.handleOAuthCallback);

// Protected routes
router.use(authenticate);

// Workspace-scoped routes
router.get('/workspace/:workspaceId', requireWorkspace(), socialAccountController.getAccounts);
router.post('/workspace/:workspaceId', requireWorkspace(['OWNER', 'ADMIN']), validateBody(connectAccountSchema), socialAccountController.connectAccount);
router.get('/workspace/:workspaceId/oauth/:platform', requireWorkspace(['OWNER', 'ADMIN']), socialAccountController.getOAuthUrl);

// Account-specific routes
router.get('/:accountId', socialAccountController.getAccount);
router.patch('/:accountId', validateBody(updateAccountSchema), socialAccountController.updateAccount);
router.delete('/:accountId', socialAccountController.disconnectAccount);
router.post('/:accountId/refresh-token', socialAccountController.refreshToken);
router.post('/:accountId/sync', socialAccountController.syncMetrics);

export default router;
