import { Router } from 'express';
import { z } from 'zod';
import * as userController from '../controllers/user.controller';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// Routes
router.get('/profile', userController.getProfile);
router.patch('/profile', validateBody(updateProfileSchema), userController.updateProfile);
router.post('/profile/avatar', userController.avatarUploadMiddleware, userController.uploadAvatar);
router.patch('/preferences', validateBody(updatePreferencesSchema), userController.updatePreferences);
router.delete('/account', userController.deleteAccount);
router.get('/workspaces', userController.getWorkspaces);
router.get('/notifications', userController.getNotifications);
router.patch('/notifications/:notificationId/read', userController.markNotificationRead);
router.patch('/notifications/read-all', userController.markAllNotificationsRead);
router.delete('/notifications/:notificationId', userController.deleteNotification);

export default router;
