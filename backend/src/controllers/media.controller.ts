import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError, sendPaginatedSuccess, parsePaginationQuery } from '../utils/response';
import { AuthRequest } from '../types';
import * as mediaService from '../services/media.service';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const uploadMiddleware = upload.single('file');
export const uploadMultipleMiddleware = upload.array('files', 10);

export const uploadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.workspace) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (!req.file) {
    return sendError(res, 'No file provided', 400);
  }

  const { folderId } = req.body;

  const media = await mediaService.uploadFile(
    req.workspace.id,
    req.user.id,
    req.file as mediaService.UploadedFile,
    folderId
  );

  sendSuccess(res, { media }, 'File uploaded', 201);
});

export const uploadMultipleFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.workspace) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return sendError(res, 'No files provided', 400);
  }

  const { folderId } = req.body;

  const mediaFiles = await Promise.all(
    req.files.map((file) =>
      mediaService.uploadFile(
        req.workspace!.id,
        req.user!.id,
        file as mediaService.UploadedFile,
        folderId
      )
    )
  );

  sendSuccess(res, { media: mediaFiles }, 'Files uploaded', 201);
});

export const createFromUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.workspace) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { name, url, thumbnailUrl, mimeType, size, width, height, duration, folderId } = req.body;

  const media = await mediaService.createMediaFromUrl(req.workspace.id, req.user.id, {
    name,
    url,
    thumbnailUrl,
    mimeType,
    size,
    width,
    height,
    duration,
    folderId,
  });

  sendSuccess(res, { media }, 'Media created', 201);
});

export const getMediaFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mediaId = req.params.mediaId as string;

  const media = await mediaService.getMediaFileById(mediaId);

  if (!media) {
    return sendError(res, 'Media file not found', 404);
  }

  sendSuccess(res, { media }, 'Media file retrieved');
});

export const getMediaFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { page, limit } = parsePaginationQuery(req.query);
  const { type, folderId, search } = req.query;

  const { files, total } = await mediaService.getWorkspaceMedia(
    req.workspace.id,
    {
      type: type as 'image' | 'video' | 'audio' | 'document',
      folderId: folderId === 'null' ? null : (folderId as string),
      search: search as string,
    },
    page,
    limit
  );

  sendPaginatedSuccess(res, files, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }, 'Media files retrieved');
});

export const updateMediaFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mediaId = req.params.mediaId as string;
  const { name, folderId, alt } = req.body;

  const media = await mediaService.updateMediaFile(mediaId, {
    originalName: name,
    folderId: folderId === null ? null : folderId,
    altText: alt,
  });

  sendSuccess(res, { media }, 'Media file updated');
});

export const deleteMediaFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mediaId = req.params.mediaId as string;

  await mediaService.deleteMediaFile(mediaId);

  sendSuccess(res, null, 'Media file deleted');
});

export const createFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.workspace) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { name, parentId } = req.body;

  const folder = await mediaService.createFolder(
    req.workspace.id,
    req.user.id,
    name,
    parentId
  );

  sendSuccess(res, { folder }, 'Folder created', 201);
});

export const getFolders = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const { parentId } = req.query;

  const folders = await mediaService.getWorkspaceFolders(
    req.workspace.id,
    parentId === 'null' ? null : (parentId as string)
  );

  sendSuccess(res, { folders }, 'Folders retrieved');
});

export const getFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const folderId = req.params.folderId as string;

  const folder = await mediaService.getFolderWithContents(folderId);

  if (!folder) {
    return sendError(res, 'Folder not found', 404);
  }

  sendSuccess(res, { folder }, 'Folder retrieved');
});

export const updateFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const folderId = req.params.folderId as string;
  const { name, parentId } = req.body;

  const folder = await mediaService.updateFolder(folderId, {
    name,
    parentId: parentId === null ? null : parentId,
  });

  sendSuccess(res, { folder }, 'Folder updated');
});

export const deleteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const folderId = req.params.folderId as string;
  const recursive = req.query.recursive as string | undefined;

  await mediaService.deleteFolder(folderId, recursive === 'true');

  sendSuccess(res, null, 'Folder deleted');
});

export const moveFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mediaIds, folderId } = req.body;

  await mediaService.moveFilesToFolder(mediaIds, folderId);

  sendSuccess(res, null, 'Files moved');
});

export const getMediaStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  const stats = await mediaService.getMediaStats(req.workspace.id);

  sendSuccess(res, { stats }, 'Media stats retrieved');
});

export const duplicateMediaFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const mediaId = req.params.mediaId as string;

  const media = await mediaService.duplicateMediaFile(mediaId, req.user.id);

  sendSuccess(res, { media }, 'Media file duplicated', 201);
});
