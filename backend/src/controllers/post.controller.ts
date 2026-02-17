import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError, sendPaginatedSuccess, parsePaginationQuery } from '../utils/response';
import { AuthRequest } from '../types';
import * as postService from '../services/post.service';
import { PostStatus, PostType, SocialPlatform } from '@prisma/client';

export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.workspace) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { content, type, platforms, scheduledAt, mediaIds, hashtags, linkUrl, aiGenerated, aiPrompt } = req.body;

  const post = await postService.createPost(req.workspace.id, req.user.id, {
    content,
    postType: type,
    platforms,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    mediaIds,
    hashtags,
    linkUrl,
    aiGenerated,
    aiPrompt,
  });

  sendSuccess(res, { post }, 'Post created', 201);
});

export const getPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;

  const post = await postService.getPostById(postId);

  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  sendSuccess(res, { post }, 'Post retrieved');
});

export const getPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    // Return empty list if no workspace
    return sendPaginatedSuccess(res, [], {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    }, 'Posts retrieved');
  }

  const { page, limit } = parsePaginationQuery(req.query);
  const { status, type, platform, startDate, endDate, socialAccountId } = req.query;

  try {
    const { posts, total } = await postService.getWorkspacePosts(
      req.workspace.id,
      {
        status: status as PostStatus,
        type: type as PostType,
        platform: platform as SocialPlatform,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        socialAccountId: socialAccountId as string,
      },
      page,
      limit
    );

    sendPaginatedSuccess(res, posts, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, 'Posts retrieved');
  } catch (error) {
    console.error('Error fetching posts:', error);
    sendPaginatedSuccess(res, [], {
      page,
      limit,
      total: 0,
      totalPages: 0,
    }, 'Posts retrieved');
  }
});

export const getScheduledPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendSuccess(res, { posts: [] }, 'Scheduled posts retrieved');
  }

  try {
    const posts = await postService.getScheduledPosts(req.workspace.id);
    sendSuccess(res, { posts }, 'Scheduled posts retrieved');
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    sendSuccess(res, { posts: [] }, 'Scheduled posts retrieved');
  }
});

export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;
  const { content, type, hashtags, scheduledAt, linkUrl } = req.body;

  const post = await postService.updatePost(postId, {
    content,
    postType: type,
    hashtags,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : scheduledAt === null ? null : undefined,
    linkUrl,
  });

  sendSuccess(res, { post }, 'Post updated');
});

export const updatePostPlatform = asyncHandler(async (req: AuthRequest, res: Response) => {
  const platformId = req.params.platformId as string;
  const { scheduledAt } = req.body;

  const platform = await postService.updatePostPlatform(platformId, {
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  });

  sendSuccess(res, { platform }, 'Post platform updated');
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;

  await postService.deletePost(postId);

  sendSuccess(res, null, 'Post deleted');
});

export const submitForApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;

  const post = await postService.submitForApproval(postId);

  sendSuccess(res, { post }, 'Post submitted for approval');
});

export const approvePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const postId = req.params.postId as string;

  const post = await postService.approvePost(postId, req.user.id);

  sendSuccess(res, { post }, 'Post approved');
});

export const rejectPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;
  const { reason } = req.body;

  const post = await postService.rejectPost(postId, reason);

  sendSuccess(res, { post }, 'Post rejected');
});

export const publishPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;

  const results = await postService.publishPost(postId);

  sendSuccess(res, { results }, 'Post publishing initiated');
});

export const schedulePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const postId = req.params.postId as string;
  const { scheduledAt } = req.body;

  if (!scheduledAt) {
    return sendError(res, 'scheduledAt is required', 400);
  }

  const post = await postService.updatePost(postId, {
    scheduledAt: new Date(scheduledAt),
  });

  // updatePost already sets status to 'SCHEDULED' when scheduledAt is provided
  sendSuccess(res, { post }, 'Post scheduled');
});

export const duplicatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const postId = req.params.postId as string;

  const post = await postService.duplicatePost(postId, req.user.id);

  sendSuccess(res, { post }, 'Post duplicated', 201);
});

export const getPostAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const platformId = req.params.platformId as string;

  const analytics = await postService.getPostAnalytics(platformId);

  sendSuccess(res, { analytics }, 'Post analytics retrieved');
});
