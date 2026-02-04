import { Router } from 'express';
import { z } from 'zod';
import * as mediaController from '../controllers/media.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Validation schemas
const createFromUrlSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  mimeType: z.string(),
  size: z.number().positive(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  folderId: z.string().uuid().optional(),
});

const updateMediaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().optional().nullable(),
  alt: z.string().max(500).optional(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

const moveFilesSchema = z.object({
  mediaIds: z.array(z.string().uuid()).min(1),
  folderId: z.string().uuid().nullable(),
});

// Workspace-scoped routes
router.get('/workspace/:workspaceId', requireWorkspace(), mediaController.getMediaFiles);
router.post('/workspace/:workspaceId/upload', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), mediaController.uploadMiddleware, mediaController.uploadFile);
router.post('/workspace/:workspaceId/upload-multiple', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), mediaController.uploadMultipleMiddleware, mediaController.uploadMultipleFiles);
router.post('/workspace/:workspaceId/url', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), validateBody(createFromUrlSchema), mediaController.createFromUrl);
router.get('/workspace/:workspaceId/stats', requireWorkspace(), mediaController.getMediaStats);

// Folders
router.get('/workspace/:workspaceId/folders', requireWorkspace(), mediaController.getFolders);
router.post('/workspace/:workspaceId/folders', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), validateBody(createFolderSchema), mediaController.createFolder);
router.get('/folders/:folderId', mediaController.getFolder);
router.patch('/folders/:folderId', validateBody(updateFolderSchema), mediaController.updateFolder);
router.delete('/folders/:folderId', mediaController.deleteFolder);

// Media files
router.get('/:mediaId', mediaController.getMediaFile);
router.patch('/:mediaId', validateBody(updateMediaSchema), mediaController.updateMediaFile);
router.delete('/:mediaId', mediaController.deleteMediaFile);
router.post('/:mediaId/duplicate', mediaController.duplicateMediaFile);

// Bulk operations
router.post('/move', validateBody(moveFilesSchema), mediaController.moveFiles);

export default router;
