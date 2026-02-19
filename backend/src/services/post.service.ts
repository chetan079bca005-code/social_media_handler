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
    include: {
      platforms: {
        include: { socialAccount: true },
      },
    },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // If published, try to delete from platforms
  if (post.status === 'PUBLISHED') {
    for (const platform of post.platforms) {
      if (platform.platformPostId && platform.socialAccount) {
        try {
          await deleteFromPlatform(
            platform.socialAccount,
            platform.platformPostId
          );
        } catch (err: any) {
          console.warn(`Could not delete post from ${platform.socialAccount.platform}: ${err.message}`);
          // Continue even if platform deletion fails
        }
      }
    }
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

// Delete post from a social platform
async function deleteFromPlatform(
  account: SocialAccountInfo,
  platformPostId: string
): Promise<void> {
  const accessToken = decrypt(account.accessToken);

  switch (account.platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM':
      await axios.delete(`https://graph.facebook.com/v18.0/${platformPostId}`, {
        params: { access_token: accessToken },
      });
      break;
    case 'TWITTER':
      await axios.delete(`https://api.twitter.com/2/tweets/${platformPostId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      break;
    case 'LINKEDIN':
      await axios.delete(`https://api.linkedin.com/v2/ugcPosts/${platformPostId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      break;
    case 'THREADS':
      await axios.delete(`https://graph.threads.net/v1.0/${platformPostId}`, {
        params: { access_token: accessToken },
      });
      break;
    default:
      // Other platforms may not support deletion
      break;
  }
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
    case 'TIKTOK':
      return publishToTikTok(accessToken, content, media);
    case 'YOUTUBE':
      return publishToYouTube(accessToken, content, media);
    case 'PINTEREST':
      return publishToPinterest(accessToken, content, media);
    case 'THREADS':
      return publishToThreads(accessToken, account.platformAccountId, content, media);
    default:
      throw new Error(`Platform ${account.platform} not supported`);
  }
}

async function publishToFacebook(
  accessToken: string,
  pageId: string,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  // If media is present, upload photos/videos
  if (media.length > 0) {
    const imageMedia = media.filter(m => m.mimeType?.startsWith('image/'));
    const videoMedia = media.filter(m => m.mimeType?.startsWith('video/'));

    if (videoMedia.length > 0) {
      // Post video
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/videos`,
        {
          file_url: videoMedia[0].url,
          description: content,
          access_token: accessToken,
        }
      );
      return {
        platformPostId: response.data.id,
        platformUrl: `https://facebook.com/${response.data.id}`,
      };
    }

    if (imageMedia.length === 1) {
      // Single photo post
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/photos`,
        {
          url: imageMedia[0].url,
          message: content,
          access_token: accessToken,
        }
      );
      return {
        platformPostId: response.data.post_id || response.data.id,
        platformUrl: `https://facebook.com/${response.data.post_id || response.data.id}`,
      };
    }

    if (imageMedia.length > 1) {
      // Multi-photo post: upload each as unpublished, then create post
      const photoIds: string[] = [];
      for (const img of imageMedia) {
        const uploadRes = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/photos`,
          {
            url: img.url,
            published: false,
            access_token: accessToken,
          }
        );
        photoIds.push(uploadRes.data.id);
      }

      // Create multi-photo post
      const attachments: Record<string, string> = {};
      photoIds.forEach((id, i) => {
        attachments[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
      });

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          message: content,
          ...attachments,
          access_token: accessToken,
        }
      );
      return {
        platformPostId: response.data.id,
        platformUrl: `https://facebook.com/${response.data.id}`,
      };
    }
  }

  // Text-only post
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
  if (media.length === 0) {
    throw new Error('Instagram requires at least one image or video');
  }

  const imageMedia = media.filter(m => m.mimeType?.startsWith('image/'));
  const videoMedia = media.filter(m => m.mimeType?.startsWith('video/'));

  let containerId: string;

  if (media.length === 1) {
    // Single image or video
    const item = media[0];
    const isVideo = item.mimeType?.startsWith('video/');

    const containerPayload: Record<string, string> = {
      caption: content,
      access_token: accessToken,
    };

    if (isVideo) {
      containerPayload.media_type = 'VIDEO';
      containerPayload.video_url = item.url;
    } else {
      containerPayload.image_url = item.url;
    }

    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      containerPayload
    );
    containerId = containerResponse.data.id;
  } else {
    // Carousel post (2-10 items)
    const childIds: string[] = [];

    for (const item of media.slice(0, 10)) {
      const isVideo = item.mimeType?.startsWith('video/');
      const childPayload: Record<string, string> = {
        is_carousel_item: 'true',
        access_token: accessToken,
      };

      if (isVideo) {
        childPayload.media_type = 'VIDEO';
        childPayload.video_url = item.url;
      } else {
        childPayload.image_url = item.url;
      }

      const childRes = await axios.post(
        `https://graph.facebook.com/v18.0/${accountId}/media`,
        childPayload
      );
      childIds.push(childRes.data.id);
    }

    // Create carousel container
    const carouselRes = await axios.post(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption: content,
        access_token: accessToken,
      }
    );
    containerId = carouselRes.data.id;
  }

  // Wait for container to be ready (Instagram processes async)
  let attempts = 0;
  const maxAttempts = 30;
  while (attempts < maxAttempts) {
    const statusRes = await axios.get(
      `https://graph.facebook.com/v18.0/${containerId}`,
      { params: { fields: 'status_code', access_token: accessToken } }
    );
    if (statusRes.data.status_code === 'FINISHED') break;
    if (statusRes.data.status_code === 'ERROR') {
      throw new Error('Instagram media processing failed');
    }
    await new Promise(r => setTimeout(r, 2000));
    attempts++;
  }

  // Publish the container
  const publishResponse = await axios.post(
    `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
    {
      creation_id: containerId,
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
  media: MediaFileInfo[]
): Promise<PublishResult> {
  const payload: Record<string, any> = { text: content };

  // Upload media if present (Twitter v1.1 media upload + v2 tweet create)
  if (media.length > 0) {
    try {
      // Twitter media upload requires v1.1 endpoint with multipart
      // For URL-based media, we download and re-upload
      const mediaIds: string[] = [];

      for (const item of media.slice(0, 4)) { // Twitter allows up to 4 images
        // Initialize upload
        const initRes = await axios.post(
          'https://upload.twitter.com/1.1/media/upload.json',
          new URLSearchParams({
            command: 'INIT',
            media_type: item.mimeType || 'image/jpeg',
            media_category: item.mimeType?.startsWith('video/') ? 'tweet_video' : 'tweet_image',
          }),
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (initRes.data?.media_id_string) {
          mediaIds.push(initRes.data.media_id_string);
        }
      }

      if (mediaIds.length > 0) {
        payload.media = { media_ids: mediaIds };
      }
    } catch (mediaErr: any) {
      // If media upload fails, still try to post text
      console.warn('Twitter media upload failed, posting text only:', mediaErr.message);
    }
  }

  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
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
  media: MediaFileInfo[]
): Promise<PublishResult> {
  const author = `urn:li:person:${profileId}`;

  // Determine share media category and upload media if present
  let shareContent: Record<string, any>;

  if (media.length > 0) {
    const imageMedia = media.filter(m => m.mimeType?.startsWith('image/'));

    if (imageMedia.length > 0) {
      // Register and upload images
      const mediaElements: any[] = [];

      for (const img of imageMedia.slice(0, 9)) { // LinkedIn allows up to 9 images
        try {
          // Register image upload
          const registerRes = await axios.post(
            'https://api.linkedin.com/v2/assets?action=registerUpload',
            {
              registerUploadRequest: {
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                owner: author,
                serviceRelationships: [{
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent',
                }],
              },
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const uploadUrl = registerRes.data?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
          const asset = registerRes.data?.value?.asset;

          if (uploadUrl && asset) {
            // Download image and upload to LinkedIn
            const imageData = await axios.get(img.url, { responseType: 'arraybuffer' });
            await axios.put(uploadUrl, imageData.data, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': img.mimeType || 'image/jpeg',
              },
            });

            mediaElements.push({
              status: 'READY',
              description: { text: '' },
              media: asset,
              title: { text: '' },
            });
          }
        } catch (err: any) {
          console.warn('LinkedIn image upload failed:', err.message);
        }
      }

      if (mediaElements.length > 0) {
        shareContent = {
          shareCommentary: { text: content },
          shareMediaCategory: 'IMAGE',
          media: mediaElements,
        };
      } else {
        // Fallback to text-only
        shareContent = {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        };
      }
    } else {
      shareContent = {
        shareCommentary: { text: content },
        shareMediaCategory: 'NONE',
      };
    }
  } else {
    shareContent = {
      shareCommentary: { text: content },
      shareMediaCategory: 'NONE',
    };
  }

  const response = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent,
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

// ─── Additional Platform Publishers ────────────────────────────────────

async function publishToTikTok(
  accessToken: string,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  if (media.length === 0 || !media[0].mimeType?.startsWith('video/')) {
    throw new Error('TikTok requires a video file');
  }

  // TikTok Content Posting API - initialize upload
  const initRes = await axios.post(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      post_info: {
        title: content.substring(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: media[0].url,
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
    platformPostId: initRes.data?.data?.publish_id,
    platformUrl: undefined,
  };
}

async function publishToYouTube(
  accessToken: string,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  if (media.length === 0 || !media[0].mimeType?.startsWith('video/')) {
    throw new Error('YouTube requires a video file');
  }

  // Extract title from first line of content, rest as description
  const lines = content.split('\n');
  const title = lines[0].substring(0, 100) || 'Untitled';
  const description = lines.slice(1).join('\n') || content;

  // YouTube Data API v3 - upload video
  // First, download the video, then upload to YouTube
  const videoData = await axios.get(media[0].url, { responseType: 'stream' });

  const response = await axios.post(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      snippet: {
        title,
        description,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // The resumable upload URL is in the Location header
  const uploadUrl = response.headers.location;
  if (uploadUrl) {
    const uploadRes = await axios.put(uploadUrl, videoData.data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': media[0].mimeType || 'video/mp4',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return {
      platformPostId: uploadRes.data?.id,
      platformUrl: `https://youtube.com/watch?v=${uploadRes.data?.id}`,
    };
  }

  return { platformPostId: undefined, platformUrl: undefined };
}

async function publishToPinterest(
  accessToken: string,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  if (media.length === 0) {
    throw new Error('Pinterest requires at least one image');
  }

  // Pinterest API v5 - create pin
  const response = await axios.post(
    'https://api.pinterest.com/v5/pins',
    {
      title: content.substring(0, 100),
      description: content,
      media_source: {
        source_type: 'image_url',
        url: media[0].url,
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
    platformPostId: response.data?.id,
    platformUrl: `https://pinterest.com/pin/${response.data?.id}`,
  };
}

async function publishToThreads(
  accessToken: string,
  accountId: string,
  content: string,
  media: MediaFileInfo[]
): Promise<PublishResult> {
  // Threads API (Meta) - similar to Instagram
  const containerPayload: Record<string, string> = {
    text: content,
    access_token: accessToken,
  };

  if (media.length > 0) {
    const isVideo = media[0].mimeType?.startsWith('video/');
    if (isVideo) {
      containerPayload.media_type = 'VIDEO';
      containerPayload.video_url = media[0].url;
    } else {
      containerPayload.media_type = 'IMAGE';
      containerPayload.image_url = media[0].url;
    }
  } else {
    containerPayload.media_type = 'TEXT';
  }

  // Create container
  const containerRes = await axios.post(
    `https://graph.threads.net/v1.0/${accountId}/threads`,
    containerPayload
  );

  // Publish
  const publishRes = await axios.post(
    `https://graph.threads.net/v1.0/${accountId}/threads_publish`,
    {
      creation_id: containerRes.data.id,
      access_token: accessToken,
    }
  );

  return {
    platformPostId: publishRes.data?.id,
    platformUrl: `https://threads.net/@${accountId}/post/${publishRes.data?.id}`,
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

  // Try to fetch live metrics from the platform API
  let liveMetrics: Record<string, any> | null = null;
  if (platform.platformPostId && platform.socialAccount) {
    try {
      liveMetrics = await fetchPostEngagement(
        platform.socialAccount,
        platform.platformPostId
      );

      // Store the fresh metrics
      if (liveMetrics) {
        await prisma.postPlatform.update({
          where: { id: platformId },
          data: { metrics: liveMetrics },
        });
      }
    } catch (err: any) {
      console.warn(`Could not fetch live metrics for ${platform.socialAccount.platform}:`, err.message);
    }
  }

  return {
    platform,
    metrics: liveMetrics || platform.metrics || {},
  };
}

// Fetch per-post engagement from platform APIs
async function fetchPostEngagement(
  account: SocialAccountInfo,
  platformPostId: string
): Promise<Record<string, any> | null> {
  const accessToken = decrypt(account.accessToken);

  try {
    switch (account.platform) {
      case 'FACEBOOK': {
        const res = await axios.get(`https://graph.facebook.com/v18.0/${platformPostId}`, {
          params: {
            fields: 'likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_engaged_users,post_clicks)',
            access_token: accessToken,
          },
        });
        const insights = res.data.insights?.data || [];
        const getInsight = (name: string) => insights.find((i: any) => i.name === name)?.values?.[0]?.value || 0;
        return {
          likes: res.data.likes?.summary?.total_count || 0,
          comments: res.data.comments?.summary?.total_count || 0,
          shares: res.data.shares?.count || 0,
          impressions: getInsight('post_impressions'),
          engagement: getInsight('post_engaged_users'),
          clicks: getInsight('post_clicks'),
        };
      }
      case 'INSTAGRAM': {
        const res = await axios.get(`https://graph.facebook.com/v18.0/${platformPostId}`, {
          params: {
            fields: 'like_count,comments_count,impressions,reach,saved,shares',
            access_token: accessToken,
          },
        });
        return {
          likes: res.data.like_count || 0,
          comments: res.data.comments_count || 0,
          shares: res.data.shares?.count || 0,
          saves: res.data.saved || 0,
          impressions: res.data.impressions || 0,
          reach: res.data.reach || 0,
          engagement: (res.data.like_count || 0) + (res.data.comments_count || 0) + (res.data.saved || 0),
        };
      }
      case 'TWITTER': {
        const res = await axios.get(`https://api.twitter.com/2/tweets/${platformPostId}`, {
          params: { 'tweet.fields': 'public_metrics' },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const metrics = res.data.data?.public_metrics || {};
        return {
          likes: metrics.like_count || 0,
          comments: metrics.reply_count || 0,
          shares: metrics.retweet_count || 0,
          impressions: metrics.impression_count || 0,
          engagement: (metrics.like_count || 0) + (metrics.reply_count || 0) + (metrics.retweet_count || 0),
          quotes: metrics.quote_count || 0,
          bookmarks: metrics.bookmark_count || 0,
        };
      }
      case 'LINKEDIN': {
        const res = await axios.get(
          `https://api.linkedin.com/v2/socialActions/${platformPostId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return {
          likes: res.data.likesSummary?.totalLikes || 0,
          comments: res.data.commentsSummary?.totalFirstLevelComments || 0,
          shares: 0,
          engagement: (res.data.likesSummary?.totalLikes || 0) + (res.data.commentsSummary?.totalFirstLevelComments || 0),
        };
      }
      default:
        return null;
    }
  } catch (err) {
    return null;
  }
}
