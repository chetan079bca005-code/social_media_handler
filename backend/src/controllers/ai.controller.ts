import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as aiService from '../services/ai.service';

export const generateContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { prompt, platform, tone, maxLength, language, includeHashtags, includeEmojis } = req.body;

  const result = await aiService.generatePostContent({
    prompt,
    platform,
    tone,
    maxLength,
    language,
    includeHashtags,
    includeEmojis,
  });

  if (!result.success) {
    return sendError(res, result.error || 'Generation failed', 500);
  }

  // Track usage
  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { content: result.data, usage: result.usage }, 'Content generated');
});

export const generateVariations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { prompt, platform, tone, count } = req.body;

  const result = await aiService.generatePostVariations(
    { prompt, platform, tone },
    count || 3
  );

  if (!result.success) {
    return sendError(res, result.error || 'Generation failed', 500);
  }

  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { variations: result.data, usage: result.usage }, 'Variations generated');
});

export const improveContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, platform, improvementType } = req.body;

  const result = await aiService.improveContent({
    content,
    platform,
    improvementType,
  });

  if (!result.success) {
    return sendError(res, result.error || 'Improvement failed', 500);
  }

  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { content: result.data, usage: result.usage }, 'Content improved');
});

export const generateHashtags = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, platform, count } = req.body;

  if (!content || content.trim().length === 0) {
    return sendError(res, 'Content is required for hashtag generation', 400);
  }

  const result = await aiService.generateHashtags({
    content,
    platform,
    count,
  });

  if (!result.success) {
    // Return a helpful error message without failing
    return sendSuccess(res, { 
      hashtags: [], 
      error: result.error || 'Hashtag generation is not available right now'
    }, 'Hashtag generation failed');
  }

  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { hashtags: result.data, usage: result.usage }, 'Hashtags generated');
});

export const generateImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { prompt, style, aspectRatio, count } = req.body;

  const result = await aiService.generateImage({
    prompt,
    style,
    aspectRatio,
    count,
  });

  if (!result.success) {
    return sendError(res, result.error || 'Image generation failed', 500);
  }

  if (req.workspace?.id) {
    await aiService.trackAIUsage(req.workspace.id, 'image', 1);
  }

  sendSuccess(res, { images: result.data }, 'Image generated');
});

export const generateCalendar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { startDate, days, postsPerDay, platforms, topics, tone } = req.body;

  const result = await aiService.generateContentCalendar(req.workspace.id, {
    startDate: new Date(startDate),
    days,
    postsPerDay,
    platforms,
    topics,
    tone,
  });

  if (!result.success) {
    return sendError(res, result.error || 'Calendar generation failed', 500);
  }

  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { calendar: result.data, usage: result.usage }, 'Calendar generated');
});

export const analyzeSentiment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content } = req.body;

  const result = await aiService.analyzeContentSentiment(content);

  if (!result.success) {
    return sendError(res, result.error || 'Analysis failed', 500);
  }

  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { analysis: result.data, usage: result.usage }, 'Sentiment analyzed');
});

export const generateReplies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, context } = req.body;

  const result = await aiService.generateReplySuggestions(content, context);

  if (!result.success) {
    return sendError(res, result.error || 'Reply generation failed', 500);
  }

  if (req.workspace?.id && result.usage) {
    await aiService.trackAIUsage(req.workspace.id, 'text', result.usage.totalTokens);
  }

  sendSuccess(res, { replies: result.data, usage: result.usage }, 'Replies generated');
});

export const transcribeAudio = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { audioUrl } = req.body;

  const result = await aiService.transcribeAudio(audioUrl);

  if (!result.success) {
    return sendError(res, result.error || 'Transcription failed', 500);
  }

  if (req.workspace?.id) {
    await aiService.trackAIUsage(req.workspace.id, 'audio', 1);
  }

  sendSuccess(res, { transcript: result.data }, 'Audio transcribed');
});

export const getUsageStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { startDate, endDate } = req.query;

  const stats = await aiService.getAIUsageStats(
    req.workspace.id,
    startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate ? new Date(endDate as string) : new Date()
  );

  sendSuccess(res, { stats }, 'Usage stats retrieved');
});
