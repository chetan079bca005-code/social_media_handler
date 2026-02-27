import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as videoService from '../services/video.service';
import * as aiService from '../services/ai.service';

// POST /api/video/submit — submit a new video generation job
export const submitVideo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { prompt, imageUrl, aspectRatio, duration, resolution } = req.body;

  const result = await videoService.submitVideoGeneration({
    prompt,
    imageUrl,
    aspectRatio,
    duration,
    resolution,
  });

  if (!result.success) {
    return sendError(res, result.error || 'Video generation failed', 502);
  }

  sendSuccess(
    res,
    { requestId: (result.data as { requestId: string }).requestId },
    'Video generation submitted',
    202
  );
});

// GET /api/video/:requestId/status — poll processing status
export const getVideoStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestId = Array.isArray(req.params.requestId)
    ? req.params.requestId[0]
    : req.params.requestId;

  const result = await videoService.checkVideoStatus(requestId);

  if (!result.success) {
    return sendError(res, result.error || 'Status check failed', 502);
  }

  sendSuccess(res, result.data, 'Video status');
});

// GET /api/video/:requestId/result — fetch final video URLs + save to Cloudinary
export const getVideoResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestId = Array.isArray(req.params.requestId)
    ? req.params.requestId[0]
    : req.params.requestId;

  const result = await videoService.getVideoResult(requestId);

  if (!result.success) {
    return sendError(res, result.error || 'Video result failed', 502);
  }

  const data = result.data as {
    status?: string;
    videoList?: string[];
    error?: string;
  };

  // When the video is ready we save it to Cloudinary + DB
  if (
    data.status === 'success' &&
    Array.isArray(data.videoList) &&
    data.videoList.length > 0 &&
    req.workspace?.id &&
    req.user?.id
  ) {
    // Track AI usage
    await aiService.trackAIUsage(req.workspace.id, 'image', 1); // reuse image quota

    // Save each video
    const saved: { cloudinaryUrl: string; publicId?: string }[] = [];
    for (const videoUrl of data.videoList) {
      try {
        const s = await videoService.saveGeneratedVideo({
          workspaceId: req.workspace.id,
          userId: req.user.id,
          videoUrl,
          prompt: (req.query.prompt as string) || 'AI generated video',
        });
        saved.push(s);
      } catch (err: any) {
        console.error('Failed to save video to Cloudinary:', err.message);
      }
    }

    // Attach cloudinary URLs to the response so the frontend can use them
    (data as any).savedVideos = saved;
  }

  sendSuccess(res, data, 'Video result');
});

// GET /api/video/history — previously generated videos
export const getVideoHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace?.id) {
    return sendError(res, 'Workspace not found', 404);
  }

  const videos = await videoService.getVideoHistory(req.workspace.id);

  sendSuccess(res, { videos }, 'Video history');
});

// ─── Text-to-Video endpoints ────────────────────────────────────────

// POST /api/video/t2v/submit — submit a text-to-video generation job
export const submitT2V = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { prompt, aspectRatio, duration, resolution } = req.body;

  const result = await videoService.submitText2Video({
    prompt,
    aspectRatio,
    duration,
    resolution,
  });

  if (!result.success) {
    return sendError(res, result.error || 'Text-to-Video generation failed', 502);
  }

  sendSuccess(
    res,
    { requestId: (result.data as { requestId: string }).requestId },
    'Text-to-Video generation submitted',
    202
  );
});

// GET /api/video/t2v/:requestId/status — poll T2V processing status
export const getT2VStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestId = Array.isArray(req.params.requestId)
    ? req.params.requestId[0]
    : req.params.requestId;

  const result = await videoService.checkT2VStatus(requestId);

  if (!result.success) {
    return sendError(res, result.error || 'Status check failed', 502);
  }

  sendSuccess(res, result.data, 'T2V video status');
});

// GET /api/video/t2v/:requestId/result — fetch final T2V video URLs + save to Cloudinary
export const getT2VResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requestId = Array.isArray(req.params.requestId)
    ? req.params.requestId[0]
    : req.params.requestId;

  const result = await videoService.getT2VResult(requestId);

  if (!result.success) {
    return sendError(res, result.error || 'T2V video result failed', 502);
  }

  const data = result.data as {
    status?: string;
    videoList?: string[];
    error?: string;
  };

  // When the video is ready we save it to Cloudinary + DB
  if (
    data.status === 'success' &&
    Array.isArray(data.videoList) &&
    data.videoList.length > 0 &&
    req.workspace?.id &&
    req.user?.id
  ) {
    await aiService.trackAIUsage(req.workspace.id, 'image', 1);

    const saved: { cloudinaryUrl: string; publicId?: string }[] = [];
    for (const videoUrl of data.videoList) {
      try {
        const s = await videoService.saveGeneratedVideo({
          workspaceId: req.workspace.id,
          userId: req.user.id,
          videoUrl,
          prompt: (req.query.prompt as string) || 'AI generated video (T2V)',
          modelName: 'google/veo-3.1-fast/text-to-video',
        });
        saved.push(s);
      } catch (err: any) {
        console.error('Failed to save T2V video to Cloudinary:', err.message);
      }
    }

    (data as any).savedVideos = saved;
  }

  sendSuccess(res, data, 'T2V video result');
});
