import { Router } from 'express';
import { z } from 'zod';
import * as videoController from '../controllers/video.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// ─── Validation schemas ─────────────────────────────────────────────
const submitVideoSchema = z.object({
  prompt: z.string().min(1).max(2000),
  imageUrl: z.string().url(),
  aspectRatio: z.enum(['16:9', '9:16']).optional(),
  duration: z.union([z.literal(4), z.literal(6), z.literal(8)]).optional(),
  resolution: z.enum(['720p', '1080p']).optional(),
});

const submitT2VSchema = z.object({
  prompt: z.string().min(1).max(2000),
  aspectRatio: z.enum(['16:9', '9:16']).optional(),
  duration: z.union([z.literal(4), z.literal(6), z.literal(8)]).optional(),
  resolution: z.enum(['720p', '1080p']).optional(),
});

// ─── Image-to-Video Routes ──────────────────────────────────────────
router.post(
  '/submit',
  requireWorkspace(),
  validateBody(submitVideoSchema),
  videoController.submitVideo
);

router.get(
  '/history',
  requireWorkspace(),
  videoController.getVideoHistory
);

router.get(
  '/:requestId/status',
  requireWorkspace(),
  videoController.getVideoStatus
);

router.get(
  '/:requestId/result',
  requireWorkspace(),
  videoController.getVideoResult
);

// ─── Text-to-Video Routes ───────────────────────────────────────────
router.post(
  '/t2v/submit',
  requireWorkspace(),
  validateBody(submitT2VSchema),
  videoController.submitT2V
);

router.get(
  '/t2v/:requestId/status',
  requireWorkspace(),
  videoController.getT2VStatus
);

router.get(
  '/t2v/:requestId/result',
  requireWorkspace(),
  videoController.getT2VResult
);

export default router;
