import Redis from 'ioredis';
import { config } from './index';

let redis: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          console.warn('Redis: Max retries reached, operating without cache');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis connected');
    });

    redis.on('error', (err) => {
      isConnected = false;
      console.warn('Redis connection error (caching disabled):', err.message);
    });

    redis.on('close', () => {
      isConnected = false;
    });

    // Attempt connection but don't block startup
    redis.connect().catch((err) => {
      console.warn('Redis initial connection failed (caching disabled):', err.message);
    });
  }

  return redis;
}

export function isRedisConnected(): boolean {
  return isConnected && redis !== null;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit().catch(() => {});
    redis = null;
    isConnected = false;
  }
}

// ============ CACHE HELPERS ============

const DEFAULT_TTL = 300; // 5 minutes
const SHORT_TTL = 60;    // 1 minute
const LONG_TTL = 900;    // 15 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null;
  try {
    const data = await getRedisClient().get(key);
    if (data) return JSON.parse(data) as T;
    return null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, data: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    await getRedisClient().setex(key, ttl, JSON.stringify(data));
  } catch {
    // Silently fail - cache is non-critical
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    const client = getRedisClient();
    if (pattern.includes('*')) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(pattern);
    }
  } catch {
    // Silently fail
  }
}

export async function cacheDelMultiple(patterns: string[]): Promise<void> {
  await Promise.all(patterns.map(p => cacheDel(p)));
}

// ============ CACHE KEY BUILDERS ============

export const CacheKeys = {
  // Dashboard / Analytics
  workspaceAnalytics: (workspaceId: string, start?: string, end?: string) =>
    `analytics:workspace:${workspaceId}:${start || 'all'}:${end || 'all'}`,
  accountAnalytics: (accountId: string, start?: string, end?: string) =>
    `analytics:account:${accountId}:${start || 'all'}:${end || 'all'}`,
  
  // Posts
  workspacePosts: (workspaceId: string, query: string) =>
    `posts:workspace:${workspaceId}:${query}`,
  post: (postId: string) => `post:${postId}`,
  scheduledPosts: (workspaceId: string) => `posts:scheduled:${workspaceId}`,

  // Social Accounts
  workspaceSocialAccounts: (workspaceId: string) => `social-accounts:${workspaceId}`,

  // Templates
  workspaceTemplates: (workspaceId: string, query: string) =>
    `templates:workspace:${workspaceId}:${query}`,
  template: (templateId: string) => `template:${templateId}`,

  // Media
  workspaceMedia: (workspaceId: string, query: string) =>
    `media:workspace:${workspaceId}:${query}`,

  // User
  userProfile: (userId: string) => `user:${userId}`,
  userNotifications: (userId: string) => `notifications:${userId}`,
  userWorkspaces: (userId: string) => `workspaces:user:${userId}`,

  // Workspace
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  workspaceMembers: (workspaceId: string) => `workspace:members:${workspaceId}`,

  // Search
  searchResults: (workspaceId: string, query: string) =>
    `search:${workspaceId}:${query}`,
};

export const CacheTTL = {
  SHORT: SHORT_TTL,
  DEFAULT: DEFAULT_TTL,
  LONG: LONG_TTL,
};

export default getRedisClient;
