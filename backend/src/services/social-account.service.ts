import prisma from '../config/database';
import { SocialPlatform, SocialAccount } from '@prisma/client';
import { AppError } from '../middleware/error';
import { encrypt, decrypt } from '../utils/encryption';
import axios from 'axios';
import { config } from '../config';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '../config/redis';

export interface ConnectAccountInput {
  platform: SocialPlatform;
  platformAccountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  accountName: string;
  accountUsername?: string;
  profileImageUrl?: string;
}

export interface AccountMetrics {
  followers: number;
  following: number;
  posts: number;
  engagement: number;
}

// Connect social account
export async function connectSocialAccount(
  workspaceId: string,
  data: ConnectAccountInput
): Promise<SocialAccount> {
  // Check if account already connected to this workspace
  const existing = await prisma.socialAccount.findFirst({
    where: {
      workspaceId,
      platform: data.platform,
      platformAccountId: data.platformAccountId,
    },
  });

  if (existing) {
    // Update existing connection
    return prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        accessToken: encrypt(data.accessToken),
        refreshToken: data.refreshToken ? encrypt(data.refreshToken) : undefined,
        tokenExpiresAt: data.tokenExpiresAt,
        accountName: data.accountName,
        accountUsername: data.accountUsername,
        profileImageUrl: data.profileImageUrl,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
  }

  // Create new connection
  const account = await prisma.socialAccount.create({
    data: {
      workspaceId,
      platform: data.platform,
      platformAccountId: data.platformAccountId,
      accessToken: encrypt(data.accessToken),
      refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
      tokenExpiresAt: data.tokenExpiresAt,
      accountName: data.accountName,
      accountUsername: data.accountUsername,
      profileImageUrl: data.profileImageUrl,
    },
  });

  // Invalidate workspace social accounts cache
  await cacheDel(CacheKeys.workspaceSocialAccounts(workspaceId));
  return account;
}

// Get social accounts for workspace
export async function getWorkspaceSocialAccounts(workspaceId: string) {
  const cacheKey = CacheKeys.workspaceSocialAccounts(workspaceId);
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: { posts: true },
      },
      analytics: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  await cacheSet(cacheKey, accounts, CacheTTL.DEFAULT);
  return accounts;
}

// Get social account by ID
export async function getSocialAccountById(accountId: string) {
  return prisma.socialAccount.findUnique({
    where: { id: accountId },
    include: {
      workspace: true,
      analytics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });
}

// Disconnect social account
export async function disconnectSocialAccount(accountId: string): Promise<void> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new AppError('Social account not found', 404);
  }

  // Soft delete - just mark as inactive
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: { isActive: false },
  });

  await cacheDel(CacheKeys.workspaceSocialAccounts(account.workspaceId));
}

// Permanently delete social account
export async function deleteSocialAccount(accountId: string): Promise<void> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new AppError('Social account not found', 404);
  }

  await prisma.socialAccount.delete({
    where: { id: accountId },
  });

  await cacheDel(CacheKeys.workspaceSocialAccounts(account.workspaceId));
}

// Refresh account tokens
export async function refreshAccessToken(accountId: string): Promise<SocialAccount> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new AppError('Social account not found', 404);
  }

  if (!account.refreshToken) {
    throw new AppError('No refresh token available', 400);
  }

  const decryptedRefreshToken = decrypt(account.refreshToken);

  let newTokens: { accessToken: string; refreshToken?: string; expiresAt?: Date };

  switch (account.platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM':
      newTokens = await refreshFacebookToken(decryptedRefreshToken);
      break;
    case 'TWITTER':
      newTokens = await refreshTwitterToken(decryptedRefreshToken);
      break;
    case 'LINKEDIN':
      newTokens = await refreshLinkedInToken(decryptedRefreshToken);
      break;
    default:
      throw new AppError(`Token refresh not supported for ${account.platform}`, 400);
  }

  return prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: encrypt(newTokens.accessToken),
      refreshToken: newTokens.refreshToken ? encrypt(newTokens.refreshToken) : undefined,
      tokenExpiresAt: newTokens.expiresAt,
    },
  });
}

// Platform-specific token refresh functions
async function refreshFacebookToken(refreshToken: string) {
  const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: config.oauth.facebook.appId,
      client_secret: config.oauth.facebook.appSecret,
      fb_exchange_token: refreshToken,
    },
  });

  return {
    accessToken: response.data.access_token,
    expiresAt: response.data.expires_in
      ? new Date(Date.now() + response.data.expires_in * 1000)
      : undefined,
  };
}

async function refreshTwitterToken(refreshToken: string) {
  const response = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.oauth.twitter.clientId,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${config.oauth.twitter.clientId}:${config.oauth.twitter.clientSecret}`
        ).toString('base64')}`,
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: response.data.expires_in
      ? new Date(Date.now() + response.data.expires_in * 1000)
      : undefined,
  };
}

async function refreshLinkedInToken(refreshToken: string) {
  const response = await axios.post(
    'https://www.linkedin.com/oauth/v2/accessToken',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.oauth.linkedin.clientId,
      client_secret: config.oauth.linkedin.clientSecret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: response.data.expires_in
      ? new Date(Date.now() + response.data.expires_in * 1000)
      : undefined,
  };
}

// Get OAuth URL for platform
export function getOAuthUrl(platform: SocialPlatform, workspaceId: string): string {
  const redirectUri = `${config.frontendUrl}/oauth/callback/${platform.toLowerCase()}`;
  const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');

  const scopes: Record<SocialPlatform, string> = {
    FACEBOOK: 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content',
    INSTAGRAM: 'instagram_basic,instagram_content_publish,instagram_manage_insights',
    TWITTER: 'tweet.read,tweet.write,users.read,offline.access',
    LINKEDIN: 'r_liteprofile,r_emailaddress,w_member_social',
    TIKTOK: 'user.info.basic,video.upload,video.publish',
    YOUTUBE: 'https://www.googleapis.com/auth/youtube.upload',
    PINTEREST: 'read_public,write_public',
    THREADS: 'threads_basic,threads_content_publish',
  };

  switch (platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM':
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.oauth.facebook.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&state=${state}`;

    case 'TWITTER':
      return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${config.oauth.twitter.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

    case 'LINKEDIN':
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.oauth.linkedin.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&state=${state}`;

    case 'TIKTOK':
      return `https://www.tiktok.com/auth/authorize/?client_key=${config.oauth.tiktok.clientKey}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    case 'YOUTUBE':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.oauth.youtube.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&state=${state}&access_type=offline`;

    case 'PINTEREST':
      return `https://www.pinterest.com/oauth/?client_id=${config.oauth.pinterest.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&state=${state}`;

    case 'THREADS':
      return `https://www.threads.net/oauth/authorize?client_id=${config.oauth.threads.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&state=${state}`;

    default:
      throw new AppError(`OAuth not supported for ${platform}`, 400);
  }
}

// Handle OAuth callback
export async function handleOAuthCallback(
  platform: SocialPlatform,
  code: string,
  workspaceId: string
): Promise<SocialAccount> {
  const redirectUri = `${config.frontendUrl}/oauth/callback/${platform.toLowerCase()}`;

  let tokenData: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  };

  let profileData: {
    id: string;
    name: string;
    username?: string;
    profileImageUrl?: string;
  };

  switch (platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM': {
      // Exchange code for token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: config.oauth.facebook.appId,
          client_secret: config.oauth.facebook.appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });

      tokenData = {
        accessToken: tokenResponse.data.access_token,
        expiresIn: tokenResponse.data.expires_in,
      };

      // Get profile
      const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,name,picture',
          access_token: tokenData.accessToken,
        },
      });

      profileData = {
        id: profileResponse.data.id,
        name: profileResponse.data.name,
        profileImageUrl: profileResponse.data.picture?.data?.url,
      };
      break;
    }

    case 'TWITTER': {
      const tokenResponse = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: 'challenge',
          client_id: config.oauth.twitter.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${config.oauth.twitter.clientId}:${config.oauth.twitter.clientSecret}`
            ).toString('base64')}`,
          },
        }
      );

      tokenData = {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        expiresIn: tokenResponse.data.expires_in,
      };

      // Get profile
      const profileResponse = await axios.get('https://api.twitter.com/2/users/me', {
        params: {
          'user.fields': 'id,name,username,profile_image_url',
        },
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });

      profileData = {
        id: profileResponse.data.data.id,
        name: profileResponse.data.data.name,
        username: profileResponse.data.data.username,
        profileImageUrl: profileResponse.data.data.profile_image_url,
      };
      break;
    }

    case 'LINKEDIN': {
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.oauth.linkedin.clientId,
          client_secret: config.oauth.linkedin.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      tokenData = {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        expiresIn: tokenResponse.data.expires_in,
      };

      // Get profile
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        params: {
          projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
        },
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });

      profileData = {
        id: profileResponse.data.id,
        name: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
        profileImageUrl: profileResponse.data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      };
      break;
    }

    default:
      throw new AppError(`OAuth callback not implemented for ${platform}`, 400);
  }

  // Connect the account
  return connectSocialAccount(workspaceId, {
    platform,
    platformAccountId: profileData.id,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    tokenExpiresAt: tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : undefined,
    accountName: profileData.name,
    accountUsername: profileData.username,
    profileImageUrl: profileData.profileImageUrl,
  });
}

// Sync account metrics
export async function syncAccountMetrics(accountId: string): Promise<void> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new AppError('Social account not found', 404);
  }

  const accessToken = decrypt(account.accessToken);
  let metrics: AccountMetrics;

  switch (account.platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM':
      metrics = await fetchFacebookMetrics(accessToken, account.platformAccountId);
      break;
    case 'TWITTER':
      metrics = await fetchTwitterMetrics(accessToken, account.platformAccountId);
      break;
    case 'LINKEDIN':
      metrics = await fetchLinkedInMetrics(accessToken, account.platformAccountId);
      break;
    default:
      throw new AppError(`Metrics sync not supported for ${account.platform}`, 400);
  }

  // Save analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.socialAccountAnalytics.upsert({
    where: {
      socialAccountId_date: {
        socialAccountId: accountId,
        date: today,
      },
    },
    update: {
      followers: metrics.followers,
      following: metrics.following,
      posts: metrics.posts,
      engagement: metrics.engagement,
    },
    create: {
      socialAccountId: accountId,
      date: today,
      followers: metrics.followers,
      following: metrics.following,
      posts: metrics.posts,
      engagement: metrics.engagement,
    },
  });

  // Update last synced
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: { lastSyncedAt: new Date() },
  });
}

// Platform-specific metrics fetching
async function fetchFacebookMetrics(accessToken: string, accountId: string): Promise<AccountMetrics> {
  const response = await axios.get(`https://graph.facebook.com/v18.0/${accountId}`, {
    params: {
      fields: 'followers_count,fan_count',
      access_token: accessToken,
    },
  });

  return {
    followers: response.data.followers_count || response.data.fan_count || 0,
    following: 0,
    posts: 0,
    engagement: 0,
  };
}

async function fetchTwitterMetrics(accessToken: string, accountId: string): Promise<AccountMetrics> {
  const response = await axios.get(`https://api.twitter.com/2/users/${accountId}`, {
    params: {
      'user.fields': 'public_metrics',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const metrics = response.data.data.public_metrics;
  return {
    followers: metrics.followers_count || 0,
    following: metrics.following_count || 0,
    posts: metrics.tweet_count || 0,
    engagement: 0,
  };
}

async function fetchLinkedInMetrics(accessToken: string, _accountId: string): Promise<AccountMetrics> {
  // LinkedIn has limited metrics API access
  const response = await axios.get('https://api.linkedin.com/v2/networkSizes/urn:li:person:me', {
    params: {
      edgeType: 'CompanyFollowedByMember',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    followers: response.data.firstDegreeSize || 0,
    following: 0,
    posts: 0,
    engagement: 0,
  };
}

// Get account analytics history
export async function getSocialAccountAnalytics(accountId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return prisma.socialAccountAnalytics.findMany({
    where: {
      socialAccountId: accountId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });
}

// Bulk sync all workspace accounts
export async function syncWorkspaceAccounts(workspaceId: string): Promise<void> {
  const accounts = await prisma.socialAccount.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
  });

  const results = await Promise.allSettled(
    accounts.map(account => syncAccountMetrics(account.id))
  );

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`Failed to sync ${failures.length}/${accounts.length} accounts`);
  }
}
