import prisma from '../config/database';
import { Post, PostStatus, PostType, SocialPlatform } from '@prisma/client';
import { AppError } from '../middleware/error';
import { decrypt } from '../utils/encryption';
import axios from 'axios';
import { cacheGet, cacheSet, cacheDel, cacheDelMultiple, CacheKeys, CacheTTL } from '../config/redis';

export interface CreatePostInput {
  content: string;
  postType: PostType;
  platforms: {
    socialAccountId: string;
  }[];
  scheduledAt?: Date;
  mediaIds?: string[];
  hashtags?: string[];
  linkUrl?: string;
  aiGenerated?: boolean;
  aiPrompt?: string;
}

export interface UpdatePostInput {
  content?: string;
  postType?: PostType;
  hashtags?: string[];
  scheduledAt?: Date | null;
  linkUrl?: string | null;
}

export interface PostFilters {
  status?: PostStatus;
  type?: PostType;
  platform?: SocialPlatform;
  startDate?: Date;
  endDate?: Date;
  socialAccountId?: string;
}

// Post includes for queries
const postIncludes = {
  platforms: {
    include: {
      socialAccount: true,
    },
  },
  mediaFiles: {
    include: {
      mediaFile: true,
    },
    orderBy: { order: 'asc' as const },
  },
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
};

// Create post
export async function createPost(
  workspaceId: string,
  authorId: string,
  data: CreatePostInput
): Promise<Post> {
  // Validate all social accounts belong to workspace
  const socialAccountIds = data.platforms.map(p => p.socialAccountId);
  const accounts = await prisma.socialAccount.findMany({
    where: {
      id: { in: socialAccountIds },
      workspaceId,
    },
  });

  if (accounts.length !== socialAccountIds.length) {
    throw new AppError('One or more social accounts not found', 400);
  }

  // Validate media files belong to workspace
  if (data.mediaIds && data.mediaIds.length > 0) {
    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        id: { in: data.mediaIds },
        workspaceId,
      },
    });

    if (mediaFiles.length !== data.mediaIds.length) {
      throw new AppError('One or more media files not found', 400);
    }
  }

  // Determine post status
  const status: PostStatus = data.scheduledAt ? 'SCHEDULED' : 'DRAFT';

  // Create post with platforms
  const post = await prisma.post.create({
    data: {
      workspaceId,
      authorId,
      content: data.content,
      postType: data.postType,
      status,
      scheduledAt: data.scheduledAt,
      hashtags: data.hashtags || [],
      linkUrl: data.linkUrl,
      aiGenerated: data.aiGenerated || false,
      aiPrompt: data.aiPrompt,
      platforms: {
        create: data.platforms.map(p => ({
          socialAccountId: p.socialAccountId,
          status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        })),
      },
      mediaFiles: data.mediaIds
        ? {
            create: data.mediaIds.map((mediaId, index) => ({
              mediaFileId: mediaId,
              order: index,
            })),
          }
        : undefined,
    },
    include: postIncludes,
  });

  // Invalidate related caches
  await cacheDelMultiple([
    `posts:workspace:${workspaceId}:*`,
    CacheKeys.scheduledPosts(workspaceId),
    `analytics:workspace:${workspaceId}:*`,
  ]);

  return post;
}

// Get post by ID
export async function getPostById(postId: string) {
  const cacheKey = CacheKeys.post(postId);
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: postIncludes,
  });

  if (post) await cacheSet(cacheKey, post, CacheTTL.DEFAULT);
  return post;
}

// Get posts for workspace
export async function getWorkspacePosts(
  workspaceId: string,
  filters: PostFilters,
  page: number = 1,
  limit: number = 20
) {
  // Build cache key from filters
  const filterKey = JSON.stringify({ ...filters, page, limit });
  const cacheKey = CacheKeys.workspacePosts(workspaceId, filterKey);
  const cached = await cacheGet<{ posts: any[]; total: number }>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = { workspaceId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.postType = filters.type;
  }

  if (filters.platform || filters.socialAccountId) {
    where.platforms = {
      some: {
        ...(filters.platform && {
          socialAccount: { platform: filters.platform },
        }),
        ...(filters.socialAccountId && {
          socialAccountId: filters.socialAccountId,
        }),
      },
    };
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postIncludes,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const result = { posts, total };
  await cacheSet(cacheKey, result, CacheTTL.SHORT);
  return result;
}

// Get scheduled posts
export async function getScheduledPosts(workspaceId: string) {
  const cacheKey = CacheKeys.scheduledPosts(workspaceId);
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      status: 'SCHEDULED',
      scheduledAt: { not: null },
    },
    include: postIncludes,
    orderBy: { scheduledAt: 'asc' },
  });

  await cacheSet(cacheKey, posts, CacheTTL.SHORT);
  return posts;
}

// Update post
export async function updatePost(
  postId: string,
  data: UpdatePostInput
): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.status === 'PUBLISHED') {
    throw new AppError('Cannot update published post', 400);
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      content: data.content,
      postType: data.postType,
      hashtags: data.hashtags,
      scheduledAt: data.scheduledAt,
      linkUrl: data.linkUrl,
      status: data.scheduledAt ? 'SCHEDULED' : post.status,
    },
    include: postIncludes,
  });

  await cacheDelMultiple([
    CacheKeys.post(postId),
    `posts:workspace:${post.workspaceId}:*`,
    CacheKeys.scheduledPosts(post.workspaceId),
  ]);
  return updated;
}

// Delete post
export async function deletePost(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.status === 'PUBLISHED') {
    throw new AppError('Cannot delete published post', 400);
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  await cacheDelMultiple([
    CacheKeys.post(postId),
    `posts:workspace:${post.workspaceId}:*`,
    CacheKeys.scheduledPosts(post.workspaceId),
    `analytics:workspace:${post.workspaceId}:*`,
  ]);
}

// Submit for approval
export async function submitForApproval(postId: string): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      approvalStatus: 'PENDING',
    },
    include: postIncludes,
  });
}

// Approve post
export async function approvePost(postId: string, approverId: string): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy: approverId,
      approvedAt: new Date(),
    },
    include: postIncludes,
  });
}

// Reject post
export async function rejectPost(postId: string, reason: string): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
    },
    include: postIncludes,
  });
}

// Publish post
export async function publishPost(postId: string): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      platforms: {
        include: {
          socialAccount: true,
        },
      },
      mediaFiles: {
        include: {
          mediaFile: true,
        },
      },
    },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Update status to publishing
  await prisma.post.update({
    where: { id: postId },
    data: { status: 'PUBLISHING' },
  });

  // Publish to each platform
  const results: { platformId: string; success: boolean; error?: string }[] = [];

  for (const platform of post.platforms) {
    try {
      const result = await publishToPlatform(
        platform.socialAccount,
        post.content,
        post.mediaFiles.map(m => m.mediaFile)
      );

      await prisma.postPlatform.update({
        where: { id: platform.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
        },
      });

      results.push({ platformId: platform.id, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await prisma.postPlatform.update({
        where: { id: platform.id },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });

      results.push({ platformId: platform.id, success: false, error: errorMessage });
    }
  }

  // Determine final status
  const allSucceeded = results.every(r => r.success);
  const allFailed = results.every(r => !r.success);
  
  let finalStatus: PostStatus;
  if (allSucceeded) {
    finalStatus = 'PUBLISHED';
  } else if (allFailed) {
    finalStatus = 'FAILED';
  } else {
    finalStatus = 'PUBLISHED'; // Partial success still counts as published
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      status: finalStatus,
      publishedAt: allSucceeded || !allFailed ? new Date() : undefined,
    },
    include: postIncludes,
  }).then(async (result) => {
    await cacheDelMultiple([
      CacheKeys.post(postId),
      `posts:workspace:${post.workspaceId}:*`,
      CacheKeys.scheduledPosts(post.workspaceId),
      `analytics:workspace:${post.workspaceId}:*`,
    ]);
    return result;
  });
}

// Platform-specific publishing
interface PublishResult {
  platformPostId?: string;
  platformUrl?: string;
}

type MediaFileInfo = {
  url: string;
  mimeType: string;
};

type SocialAccountInfo = {
  platform: SocialPlatform;
  accessToken: string;
  platformAccountId: string;
};

async function publishToPlatform(
  account: SocialAccountInfo,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  const accessToken = decrypt(account.accessToken);

  switch (account.platform) {
    case 'FACEBOOK':
      return publishToFacebook(accessToken, account.platformAccountId, content, media);
    case 'INSTAGRAM':
      return publishToInstagram(accessToken, account.platformAccountId, content, media);
    case 'TWITTER':
      return publishToTwitter(accessToken, content, media);
    case 'LINKEDIN':
      return publishToLinkedIn(accessToken, account.platformAccountId, content, media);
    default:
      throw new Error(`Platform ${account.platform} not supported`);
  }
}

async function publishToFacebook(
  accessToken: string,
  pageId: string,
  content: string,
  _media: MediaFileInfo[]
): Promise<PublishResult> {
  // Placeholder - implement actual Facebook API
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      message: content,
      access_token: accessToken,
    }
  );

  return {
    platformPostId: response.data.id,
    platformUrl: `https://facebook.com/${response.data.id}`,
  };
}

async function publishToInstagram(
  accessToken: string,
  accountId: string,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  // Placeholder - implement actual Instagram API
  if (media.length === 0) {
    throw new Error('Instagram requires at least one image');
  }

  // Create media container
  const containerResponse = await axios.post(
    `https://graph.facebook.com/v18.0/${accountId}/media`,
    {
      image_url: media[0].url,
      caption: content,
      access_token: accessToken,
    }
  );

  // Publish the container
  const publishResponse = await axios.post(
    `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
    {
      creation_id: containerResponse.data.id,
      access_token: accessToken,
    }
  );

  return {
    platformPostId: publishResponse.data.id,
    platformUrl: `https://instagram.com/p/${publishResponse.data.id}`,
  };
}

async function publishToTwitter(
  accessToken: string,
  content: string,
  _media: MediaFileInfo[]
): Promise<PublishResult> {
  // Placeholder - implement actual Twitter/X API
  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text: content },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return {
    platformPostId: response.data.data.id,
    platformUrl: `https://twitter.com/i/web/status/${response.data.data.id}`,
  };
}

async function publishToLinkedIn(
  accessToken: string,
  profileId: string,
  content: string,
  _media: MediaFileInfo[]
): Promise<PublishResult> {
  // Placeholder - implement actual LinkedIn API
  const response = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author: `urn:li:person:${profileId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    platformPostId: response.data.id,
    platformUrl: `https://linkedin.com/feed/update/${response.data.id}`,
  };
}

// Duplicate post
export async function duplicatePost(postId: string, userId: string): Promise<Post> {
  const original = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      platforms: true,
      mediaFiles: true,
    },
  });

  if (!original) {
    throw new AppError('Post not found', 404);
  }

  return prisma.post.create({
    data: {
      workspaceId: original.workspaceId,
      authorId: userId,
      content: `${original.content} (copy)`,
      postType: original.postType,
      status: 'DRAFT',
      hashtags: original.hashtags,
      aiGenerated: original.aiGenerated,
      aiPrompt: original.aiPrompt,
      platforms: {
        create: original.platforms.map(p => ({
          socialAccountId: p.socialAccountId,
          status: 'DRAFT',
        })),
      },
      mediaFiles: {
        create: original.mediaFiles.map((m, index) => ({
          mediaFileId: m.mediaFileId,
          order: index,
        })),
      },
    },
    include: postIncludes,
  });
}

// Update platform settings
export async function updatePostPlatform(
  platformId: string,
  data: { scheduledAt?: Date | null }
) {
  return prisma.postPlatform.update({
    where: { id: platformId },
    data: {
      status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
    },
    include: {
      post: true,
      socialAccount: true,
    },
  });
}

// Get post analytics
export async function getPostAnalytics(platformId: string) {
  const platform = await prisma.postPlatform.findUnique({
    where: { id: platformId },
    include: {
      post: true,
      socialAccount: true,
    },
  });

  if (!platform) {
    throw new AppError('Post platform not found', 404);
  }

  // Return metrics from database
  return {
    platform,
    metrics: platform.metrics,
  };
}
