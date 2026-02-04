import { Router } from 'express';
import { z } from 'zod';
import * as aiController from '../controllers/ai.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Validation schemas
const generateContentSchema = z.object({
  prompt: z.string().min(1).max(1000),
  platform: z.string().optional(),
  tone: z.string().optional(),
  maxLength: z.number().positive().optional(),
  language: z.string().optional(),
  includeHashtags: z.boolean().optional(),
  includeEmojis: z.boolean().optional(),
});

const generateVariationsSchema = z.object({
  prompt: z.string().min(1).max(1000),
  platform: z.string().optional(),
  tone: z.string().optional(),
  count: z.number().min(1).max(5).optional(),
});

const improveContentSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.string().optional(),
  improvementType: z.enum(['grammar', 'engagement', 'professional', 'casual', 'seo']),
});

const generateHashtagsSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.string().optional(),
  count: z.number().min(1).max(30).optional(),
});

const generateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.string().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
  count: z.number().min(1).max(4).optional(),
});

const generateCalendarSchema = z.object({
  startDate: z.string().datetime(),
  days: z.number().min(1).max(30),
  postsPerDay: z.number().min(1).max(10),
  platforms: z.array(z.string()).min(1),
  topics: z.array(z.string()).min(1),
  tone: z.string().optional(),
});

const analyzeSentimentSchema = z.object({
  content: z.string().min(1).max(5000),
});

const generateRepliesSchema = z.object({
  content: z.string().min(1).max(2000),
  context: z.string().optional(),
});

const transcribeAudioSchema = z.object({
  audioUrl: z.string().url(),
});

// Routes
router.post('/generate', requireWorkspace(), validateBody(generateContentSchema), aiController.generateContent);
router.post('/variations', requireWorkspace(), validateBody(generateVariationsSchema), aiController.generateVariations);
router.post('/improve', requireWorkspace(), validateBody(improveContentSchema), aiController.improveContent);
router.post('/hashtags', requireWorkspace(), validateBody(generateHashtagsSchema), aiController.generateHashtags);
router.post('/image', requireWorkspace(), validateBody(generateImageSchema), aiController.generateImage);
router.post('/calendar', requireWorkspace(), validateBody(generateCalendarSchema), aiController.generateCalendar);
router.post('/sentiment', requireWorkspace(), validateBody(analyzeSentimentSchema), aiController.analyzeSentiment);
router.post('/replies', requireWorkspace(), validateBody(generateRepliesSchema), aiController.generateReplies);
router.post('/transcribe', requireWorkspace(), validateBody(transcribeAudioSchema), aiController.transcribeAudio);
router.get('/usage', requireWorkspace(), aiController.getUsageStats);

export default router;
