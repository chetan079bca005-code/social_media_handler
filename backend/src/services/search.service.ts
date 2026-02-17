import prisma from '../config/database';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '../config/redis';

export interface SearchResult {
  type: 'post' | 'template' | 'media' | 'social_account';
  id: string;
  title: string;
  subtitle: string;
  url?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export async function globalSearch(
  workspaceId: string,
  query: string,
  limit: number = 20
): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [], total: 0, query };
  }

  const trimmed = query.trim();

  // Check cache
  const cacheKey = CacheKeys.searchResults(workspaceId, `${trimmed}:${limit}`);
  const cached = await cacheGet<SearchResponse>(cacheKey);
  if (cached) return cached;

  // Search across all entities in parallel
  const [posts, templates, mediaFiles, socialAccounts] = await Promise.all([
    // Search posts
    prisma.post.findMany({
      where: {
        workspaceId,
        OR: [
          { content: { contains: trimmed, mode: 'insensitive' } },
          { hashtags: { hasSome: [trimmed] } },
        ],
      },
      select: {
        id: true,
        content: true,
        status: true,
        postType: true,
        createdAt: true,
        platforms: {
          select: {
            socialAccount: { select: { platform: true, accountName: true } },
          },
          take: 1,
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Search templates
    prisma.template.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
          { content: { contains: trimmed, mode: 'insensitive' } },
          { tags: { hasSome: [trimmed] } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),

    // Search media
    prisma.mediaFile.findMany({
      where: {
        workspaceId,
        OR: [
          { originalName: { contains: trimmed, mode: 'insensitive' } },
          { filename: { contains: trimmed, mode: 'insensitive' } },
          { tags: { hasSome: [trimmed] } },
          { altText: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        originalName: true,
        filename: true,
        mimeType: true,
        url: true,
        thumbnailUrl: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Search social accounts
    prisma.socialAccount.findMany({
      where: {
        workspaceId,
        OR: [
          { accountName: { contains: trimmed, mode: 'insensitive' } },
          { accountUsername: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        accountUsername: true,
        profileImageUrl: true,
        isActive: true,
      },
      take: limit,
    }),
  ]);

  // Format results
  const results: SearchResult[] = [];

  for (const post of posts) {
    results.push({
      type: 'post',
      id: post.id,
      title: post.content.substring(0, 80) + (post.content.length > 80 ? '...' : ''),
      subtitle: `${post.status} • ${post.postType}`,
      metadata: {
        status: post.status,
        platform: post.platforms[0]?.socialAccount?.platform,
      },
    });
  }

  for (const template of templates) {
    results.push({
      type: 'template',
      id: template.id,
      title: template.name,
      subtitle: template.description || template.category || 'Template',
    });
  }

  for (const media of mediaFiles) {
    results.push({
      type: 'media',
      id: media.id,
      title: media.originalName || media.filename,
      subtitle: media.mimeType,
      imageUrl: media.thumbnailUrl || media.url,
    });
  }

  for (const account of socialAccounts) {
    results.push({
      type: 'social_account',
      id: account.id,
      title: account.accountName,
      subtitle: account.platform + (account.accountUsername ? ` • ${account.accountUsername}` : ''),
      imageUrl: account.profileImageUrl || undefined,
    });
  }

  const response: SearchResponse = {
    results: results.slice(0, limit),
    total: results.length,
    query: trimmed,
  };

  await cacheSet(cacheKey, response, CacheTTL.SHORT);
  return response;
}
