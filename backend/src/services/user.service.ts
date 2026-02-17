import prisma from '../config/database';
import { User } from '@prisma/client';
import { AppError } from '../middleware/error';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '../config/redis';

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
  preferences?: Record<string, unknown>;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const cacheKey = CacheKeys.userProfile(userId);
  const cached = await cacheGet<User>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user) await cacheSet(cacheKey, user, CacheTTL.DEFAULT);
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

// Update user profile
export async function updateUser(userId: string, data: UpdateUserInput): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Merge preferences if provided
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }

  if (data.timezone !== undefined) {
    updateData.timezone = data.timezone;
  }

  if (data.language !== undefined) {
    updateData.language = data.language;
  }
  
  if (data.preferences !== undefined) {
    const currentPrefs = user.preferences as Record<string, unknown>;
    updateData.preferences = { ...currentPrefs, ...data.preferences };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  await cacheDel(CacheKeys.userProfile(userId));
  return updated;
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const currentPrefs = (user.preferences as Record<string, unknown>) || {};

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      preferences: { ...currentPrefs, ...preferences } as object,
    },
  });

  await cacheDel(CacheKeys.userProfile(userId));
  return updated;
}

// Delete user account
export async function deleteUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Delete user and all related data (cascading)
  await prisma.user.delete({
    where: { id: userId },
  });
}

// Get user's workspaces
export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
              socialAccounts: true,
              posts: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
}

// Get user notifications
export async function getUserNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options;

  const cacheKey = `${CacheKeys.userNotifications(userId)}:${unreadOnly}:${limit}:${offset}`;
  const cached = await cacheGet<{ notifications: any[]; total: number }>(cacheKey);
  if (cached) return cached;

  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  const result = { notifications, total };
  await cacheSet(cacheKey, result, CacheTTL.SHORT);
  return result;
}

// Mark notification as read
export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  await cacheDel(`${CacheKeys.userNotifications(userId)}:*`);
}

// Mark all notifications as read
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  await cacheDel(`${CacheKeys.userNotifications(userId)}:*`);
}

// Create notification
export async function createNotification(data: {
  userId: string;
  type: 'POST_PUBLISHED' | 'POST_FAILED' | 'POST_SCHEDULED' | 'APPROVAL_NEEDED' | 'APPROVAL_RECEIVED' | 'TEAM_INVITE' | 'ACCOUNT_CONNECTED' | 'ACCOUNT_DISCONNECTED' | 'ANALYTICS_REPORT' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: (data.data || {}) as object,
    },
  }).then(async (notification) => {
    await cacheDel(`${CacheKeys.userNotifications(data.userId)}:*`);
    return notification;
  });
}
