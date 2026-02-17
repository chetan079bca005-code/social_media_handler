import prisma from '../config/database';
import { SocialPlatform } from '@prisma/client';
import { decrypt } from '../utils/encryption';
import axios from 'axios';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '../config/redis';

export interface AnalyticsTimeframe {
  startDate: Date;
  endDate: Date;
}

export interface AccountAnalytics {
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  impressions: number;
  reach: number;
  growth: {
    followers: number;
    engagement: number;
  };
}

export interface PostAnalytics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
}

export interface AggregatedAnalytics {
  totalFollowers: number;
  totalPosts: number;
  totalEngagement: number;
  totalImpressions: number;
  totalReach: number;
  avgEngagementRate: number;
  followerGrowth: number;
  topPosts: Array<{
    id: string;
    content: string;
    platform: string;
    engagement: number;
  }>;
  byPlatform: Record<string, {
    followers: number;
    posts: number;
    engagement: number;
  }>;
  trend: Array<{
    date: string;
    followers: number;
    engagement: number;
    impressions: number;
  }>;
}

// Get aggregated analytics for workspace
export async function getWorkspaceAnalytics(
  workspaceId: string,
  timeframe: AnalyticsTimeframe
): Promise<AggregatedAnalytics> {
  // Check cache first
  const cacheKey = CacheKeys.workspaceAnalytics(
    workspaceId,
    timeframe.startDate.toISOString(),
    timeframe.endDate.toISOString()
  );
  const cached = await cacheGet<AggregatedAnalytics>(cacheKey);
  if (cached) return cached;

  // Get all social accounts
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId, isActive: true },
    include: {
      analytics: {
        where: {
          date: {
            gte: timeframe.startDate,
            lte: timeframe.endDate,
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  // Get published posts in timeframe
  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      publishedAt: {
        gte: timeframe.startDate,
        lte: timeframe.endDate,
      },
    },
    include: {
      platforms: {
        include: {
          socialAccount: true,
        },
      },
    },
  });

  // Calculate aggregated stats
  let totalFollowers = 0;
  let totalEngagement = 0;
  let followerGrowth = 0;
  const byPlatform: Record<string, { followers: number; posts: number; engagement: number }> = {};

  for (const account of accounts) {
    const latestAnalytics = account.analytics[account.analytics.length - 1];
    const earliestAnalytics = account.analytics[0];

    if (latestAnalytics) {
      totalFollowers += latestAnalytics.followers || 0;
      totalEngagement += latestAnalytics.engagement || 0;

      if (earliestAnalytics) {
        followerGrowth += (latestAnalytics.followers || 0) - (earliestAnalytics.followers || 0);
      }

      // By platform
      if (!byPlatform[account.platform]) {
        byPlatform[account.platform] = { followers: 0, posts: 0, engagement: 0 };
      }
      byPlatform[account.platform].followers += latestAnalytics.followers || 0;
      byPlatform[account.platform].engagement += latestAnalytics.engagement || 0;
    }
  }

  // Count posts by platform
  for (const post of posts) {
    for (const platform of post.platforms) {
      const platformName = platform.socialAccount.platform;
      if (!byPlatform[platformName]) {
        byPlatform[platformName] = { followers: 0, posts: 0, engagement: 0 };
      }
      byPlatform[platformName].posts++;
    }
  }

  // Generate trend data
  const trend = generateTrendData(accounts, timeframe);

  // Get top posts (would need actual engagement data from platforms)
  const topPosts = posts.slice(0, 5).map(post => ({
    id: post.id,
    content: post.content.substring(0, 100),
    platform: post.platforms[0]?.socialAccount.platform || 'unknown',
    engagement: 0, // Would come from platform analytics
  }));

  const result: AggregatedAnalytics = {
    totalFollowers,
    totalPosts: posts.length,
    totalEngagement,
    totalImpressions: 0, // Would need platform-specific data
    totalReach: 0,
    avgEngagementRate: totalFollowers > 0 ? (totalEngagement / totalFollowers) * 100 : 0,
    followerGrowth,
    topPosts,
    byPlatform,
    trend,
  };

  // Cache the result
  await cacheSet(cacheKey, result, CacheTTL.DEFAULT);

  return result;
}

// Get analytics for specific account
export async function getAccountAnalytics(
  accountId: string,
  timeframe: AnalyticsTimeframe
): Promise<AccountAnalytics | null> {
  const cacheKey = CacheKeys.accountAnalytics(
    accountId,
    timeframe.startDate.toISOString(),
    timeframe.endDate.toISOString()
  );
  const cached = await cacheGet<AccountAnalytics>(cacheKey);
  if (cached) return cached;

  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    include: {
      analytics: {
        where: {
          date: {
            gte: timeframe.startDate,
            lte: timeframe.endDate,
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!account) {
    return null;
  }

  const latest = account.analytics[account.analytics.length - 1];
  const earliest = account.analytics[0];

  if (!latest) {
    return {
      followers: 0,
      following: 0,
      posts: 0,
      engagement: 0,
      impressions: 0,
      reach: 0,
      growth: { followers: 0, engagement: 0 },
    };
  }

  const result: AccountAnalytics = {
    followers: latest.followers || 0,
    following: latest.following || 0,
    posts: latest.posts || 0,
    engagement: latest.engagement || 0,
    impressions: 0,
    reach: 0,
    growth: {
      followers: earliest ? (latest.followers || 0) - (earliest.followers || 0) : 0,
      engagement: earliest ? (latest.engagement || 0) - (earliest.engagement || 0) : 0,
    },
  };

  await cacheSet(cacheKey, result, CacheTTL.DEFAULT);
  return result;
}

// Fetch and store analytics from platforms
export async function syncAccountAnalytics(accountId: string): Promise<void> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.isActive) {
    return;
  }

  const accessToken = decrypt(account.accessToken);
  let analytics: Partial<{
    followers: number;
    following: number;
    posts: number;
    engagement: number;
  }> = {};

  try {
    switch (account.platform) {
      case 'INSTAGRAM':
        analytics = await fetchInstagramAnalytics(accessToken, account.platformAccountId);
        break;
      case 'FACEBOOK':
        analytics = await fetchFacebookAnalytics(accessToken, account.platformAccountId);
        break;
      case 'TWITTER':
        analytics = await fetchTwitterAnalytics(accessToken, account.platformAccountId);
        break;
      case 'LINKEDIN':
        analytics = await fetchLinkedInAnalytics(accessToken, account.platformAccountId);
        break;
      case 'TIKTOK':
        analytics = await fetchTikTokAnalytics(accessToken);
        break;
      case 'YOUTUBE':
        analytics = await fetchYouTubeAnalytics(accessToken, account.platformAccountId);
        break;
    }

    // Store analytics
    await prisma.socialAccountAnalytics.create({
      data: {
        socialAccountId: accountId,
        date: new Date(),
        followers: analytics.followers ?? 0,
        following: analytics.following ?? 0,
        posts: analytics.posts ?? 0,
        engagement: analytics.engagement ?? 0,
      },
    });

    // Update last sync time
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date() },
    });
  } catch (error) {
    console.error(`Failed to sync analytics for account ${accountId}:`, error);
  }
}

// Platform-specific analytics fetching
async function fetchInstagramAnalytics(accessToken: string, accountId: string) {
  const response = await axios.get(
    `https://graph.instagram.com/v18.0/${accountId}`,
    {
      params: {
        fields: 'followers_count,follows_count,media_count',
        access_token: accessToken,
      },
    }
  );

  return {
    followers: response.data.followers_count,
    following: response.data.follows_count,
    posts: response.data.media_count,
    engagement: 0,
  };
}

async function fetchFacebookAnalytics(accessToken: string, pageId: string) {
  const response = await axios.get(
    `https://graph.facebook.com/v18.0/${pageId}`,
    {
      params: {
        fields: 'followers_count,fan_count',
        access_token: accessToken,
      },
    }
  );

  return {
    followers: response.data.followers_count || response.data.fan_count,
    following: 0,
    posts: 0,
    engagement: 0,
  };
}

async function fetchTwitterAnalytics(accessToken: string, userId: string) {
  const response = await axios.get(
    `https://api.twitter.com/2/users/${userId}`,
    {
      params: { 'user.fields': 'public_metrics' },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const metrics = response.data.data?.public_metrics || {};
  return {
    followers: metrics.followers_count,
    following: metrics.following_count,
    posts: metrics.tweet_count,
    engagement: 0,
  };
}

async function fetchLinkedInAnalytics(accessToken: string, organizationId: string) {
  const response = await axios.get(
    `https://api.linkedin.com/v2/networkSizes/urn:li:organization:${organizationId}`,
    {
      params: { edgeType: 'CompanyFollowedByMember' },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return {
    followers: response.data.firstDegreeSize || 0,
    following: 0,
    posts: 0,
    engagement: 0,
  };
}

async function fetchTikTokAnalytics(accessToken: string) {
  const response = await axios.get(
    'https://open.tiktokapis.com/v2/user/info/',
    {
      params: { fields: 'follower_count,following_count,video_count' },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return {
    followers: response.data.data?.user?.follower_count,
    following: response.data.data?.user?.following_count,
    posts: response.data.data?.user?.video_count,
    engagement: 0,
  };
}

async function fetchYouTubeAnalytics(accessToken: string, channelId: string) {
  const response = await axios.get(
    'https://www.googleapis.com/youtube/v3/channels',
    {
      params: {
        part: 'statistics',
        id: channelId,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const stats = response.data.items?.[0]?.statistics || {};
  return {
    followers: parseInt(stats.subscriberCount) || 0,
    following: 0,
    posts: parseInt(stats.videoCount) || 0,
    engagement: parseInt(stats.viewCount) || 0,
  };
}

// Generate trend data from analytics history
function generateTrendData(
  accounts: Array<{
    analytics: Array<{
      date: Date;
      followers: number;
      engagement: number;
    }>;
  }>,
  timeframe: AnalyticsTimeframe
) {
  const dailyData: Record<string, { followers: number; engagement: number; impressions: number }> = {};

  // Initialize daily buckets
  const currentDate = new Date(timeframe.startDate);
  while (currentDate <= timeframe.endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyData[dateKey] = { followers: 0, engagement: 0, impressions: 0 };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Aggregate data
  for (const account of accounts) {
    for (const analytics of account.analytics) {
      const dateKey = analytics.date.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].followers += analytics.followers || 0;
        dailyData[dateKey].engagement += analytics.engagement || 0;
      }
    }
  }

  return Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Get post performance analytics
export async function getPostPerformanceAnalytics(
  workspaceId: string,
  timeframe: AnalyticsTimeframe
) {
  const cacheKey = `analytics:posts:${workspaceId}:${timeframe.startDate.toISOString()}:${timeframe.endDate.toISOString()}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      publishedAt: {
        gte: timeframe.startDate,
        lte: timeframe.endDate,
      },
    },
    include: {
      platforms: {
        include: {
          socialAccount: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  // Group by type
  const byType: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const byHour: Record<number, number> = {};
  const byDayOfWeek: Record<number, number> = {};

  for (const post of posts) {
    // By type
    byType[post.postType] = (byType[post.postType] || 0) + 1;

    // By platform
    for (const platform of post.platforms) {
      const platformName = platform.socialAccount.platform;
      byPlatform[platformName] = (byPlatform[platformName] || 0) + 1;
    }

    // By hour
    if (post.publishedAt) {
      const hour = post.publishedAt.getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;

      // By day of week
      const dayOfWeek = post.publishedAt.getDay();
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + 1;
    }
  }

  const result = {
    totalPosts: posts.length,
    byType,
    byPlatform,
    byHour,
    byDayOfWeek,
    posts: posts.map(post => ({
      id: post.id,
      content: post.content.substring(0, 100),
      postType: post.postType,
      publishedAt: post.publishedAt,
      platforms: post.platforms.map(p => p.socialAccount.platform),
    })),
  };

  await cacheSet(cacheKey, result, CacheTTL.DEFAULT);
  return result;
}

// Create analytics snapshot for historical data
export async function createAnalyticsSnapshot(workspaceId: string): Promise<void> {
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId, isActive: true },
    include: {
      analytics: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  let totalFollowers = 0;
  let totalEngagement = 0;

  for (const account of accounts) {
    const latest = account.analytics[0];
    if (latest) {
      totalFollowers += latest.followers || 0;
      totalEngagement += Math.round(latest.engagement || 0);
    }
  }

  // Store snapshot - use date field and match schema fields
  await prisma.analyticsSnapshot.create({
    data: {
      workspaceId,
      date: new Date(),
      totalFollowers,
      totalEngagement,
      totalPosts: 0,
      totalImpressions: 0,
      totalReach: 0,
    },
  });
}

// Get historical snapshots
export async function getAnalyticsSnapshots(
  workspaceId: string,
  timeframe: AnalyticsTimeframe
) {
  const cacheKey = `analytics:snapshots:${workspaceId}:${timeframe.startDate.toISOString()}:${timeframe.endDate.toISOString()}`;
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: timeframe.startDate,
        lte: timeframe.endDate,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  await cacheSet(cacheKey, snapshots, CacheTTL.DEFAULT);
  return snapshots;
}

// Best times to post analysis
export async function getBestTimesToPost(workspaceId: string) {
  const cacheKey = `analytics:best-times:${workspaceId}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    select: {
      publishedAt: true,
      platforms: {
        select: {
          socialAccount: {
            select: { platform: true },
          },
        },
      },
    },
  });

  const hourlyEngagement: Record<number, { count: number; platforms: Set<string> }> = {};
  const dailyEngagement: Record<number, { count: number; platforms: Set<string> }> = {};

  for (const post of posts) {
    if (post.publishedAt) {
      const hour = post.publishedAt.getHours();
      const day = post.publishedAt.getDay();

      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = { count: 0, platforms: new Set() };
      }
      hourlyEngagement[hour].count++;
      post.platforms.forEach(p => hourlyEngagement[hour].platforms.add(p.socialAccount.platform));

      if (!dailyEngagement[day]) {
        dailyEngagement[day] = { count: 0, platforms: new Set() };
      }
      dailyEngagement[day].count++;
      post.platforms.forEach(p => dailyEngagement[day].platforms.add(p.socialAccount.platform));
    }
  }

  // Convert to arrays
  const bestHours = Object.entries(hourlyEngagement)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      count: data.count,
      platforms: Array.from(data.platforms),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const bestDays = Object.entries(dailyEngagement)
    .map(([day, data]) => ({
      day: parseInt(day),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
      count: data.count,
      platforms: Array.from(data.platforms),
    }))
    .sort((a, b) => b.count - a.count);

  const result = {
    bestHours,
    bestDays,
    totalAnalyzed: posts.length,
  };

  await cacheSet(cacheKey, result, CacheTTL.LONG);
  return result;
}
