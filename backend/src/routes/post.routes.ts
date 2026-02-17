import { Router } from 'express';
import { z } from 'zod';
import * as postController from '../controllers/post.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Validation schemas
const createPostSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL']),
  platforms: z.array(z.object({
    socialAccountId: z.string(),
    platformContent: z.string().optional(),
  })).min(1),
  scheduledAt: z.string().datetime().optional(),
  mediaIds: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  linkUrl: z.string().url().optional(),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional(),
});

const updatePostSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(10000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL']).optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
});

const updatePlatformSchema = z.object({
  platformContent: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

const rejectPostSchema = z.object({
  reason: z.string().min(1).max(500),
});

// Workspace-scoped routes
router.get('/', requireWorkspace(), postController.getPosts);
router.get('/scheduled', requireWorkspace(), postController.getScheduledPosts);
router.post('/', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), validateBody(createPostSchema), postController.createPost);
router.get('/workspace/:workspaceId', requireWorkspace(), postController.getPosts);
router.get('/workspace/:workspaceId/scheduled', requireWorkspace(), postController.getScheduledPosts);
router.post('/workspace/:workspaceId', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), validateBody(createPostSchema), postController.createPost);

// Post-specific routes
router.get('/:postId', postController.getPost);
router.patch('/:postId', validateBody(updatePostSchema), postController.updatePost);
router.delete('/:postId', postController.deletePost);
router.post('/:postId/duplicate', postController.duplicatePost);

// Schedule endpoint
router.post('/:postId/schedule', postController.schedulePost);

// Platform-specific routes
router.patch('/platforms/:platformId', validateBody(updatePlatformSchema), postController.updatePostPlatform);
router.get('/platforms/:platformId/analytics', postController.getPostAnalytics);

// Approval workflow  
router.post('/:postId/submit', postController.submitForApproval);
router.post('/:postId/approve', postController.approvePost);
router.post('/:postId/reject', validateBody(rejectPostSchema), postController.rejectPost);

// Publishing
router.post('/:postId/publish', postController.publishPost);

export default router;
