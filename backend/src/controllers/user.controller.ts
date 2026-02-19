import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError, sendPaginatedSuccess, parsePaginationQuery } from '../utils/response';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';
import multer from 'multer';
import { isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary';

// Multer for avatar upload (memory storage, 5MB max, images only)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const avatarUploadMiddleware = avatarUpload.single('avatar');

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const user = await userService.getUserById(req.user.id);
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, { user }, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { name, avatarUrl, timezone, language } = req.body;

  const user = await userService.updateUser(req.user.id, {
    name,
    avatarUrl,
    timezone,
    language,
  });

  sendSuccess(res, { user }, 'Profile updated');
});

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (!req.file) {
    return sendError(res, 'No image file provided', 400);
  }

  if (!isCloudinaryConfigured()) {
    return sendError(res, 'Image upload service not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env', 500);
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'socialhub/avatars',
    publicId: `avatar_${req.user.id}`,
    resourceType: 'image',
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face', quality: 'auto', format: 'webp' }],
  });

  const user = await userService.updateUser(req.user.id, {
    avatarUrl: result.secureUrl,
  });

  sendSuccess(res, { user, avatarUrl: result.secureUrl }, 'Avatar uploaded');
});

export const updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const user = await userService.updateUserPreferences(req.user.id, req.body);

  sendSuccess(res, { user }, 'Preferences updated');
});

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  await userService.deleteUser(req.user.id);

  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Account deleted');
});

export const getWorkspaces = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const workspaces = await userService.getUserWorkspaces(req.user.id);

  sendSuccess(res, { workspaces }, 'Workspaces retrieved');
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { page, limit } = parsePaginationQuery(req.query);
  const unreadOnly = req.query.unreadOnly === 'true';

  const { notifications, total } = await userService.getUserNotifications(
    req.user.id,
    { unreadOnly, limit, offset: (page - 1) * limit }
  );

  sendPaginatedSuccess(res, notifications, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }, 'Notifications retrieved');
});

export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const notificationId = req.params.notificationId as string;

  await userService.markNotificationRead(req.user.id, notificationId);

  sendSuccess(res, null, 'Notification marked as read');
});

export const markAllNotificationsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  await userService.markAllNotificationsRead(req.user.id);

  sendSuccess(res, null, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const notificationId = req.params.notificationId as string;
  await userService.deleteNotification(req.user.id, notificationId);

  sendSuccess(res, null, 'Notification deleted');
});
