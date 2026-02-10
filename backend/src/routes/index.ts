import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import workspaceRoutes from './workspace.routes';
import socialAccountRoutes from './social-account.routes';
import postRoutes from './post.routes';
import aiRoutes from './ai.routes';
import mediaRoutes from './media.routes';
import analyticsRoutes from './analytics.routes';
import templateRoutes from './template.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/social-accounts', socialAccountRoutes);
router.use('/posts', postRoutes);
router.use('/ai', aiRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/templates', templateRoutes);

export default router;
