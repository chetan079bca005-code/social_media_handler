import prisma from '../config/database';
import { MediaFile } from '@prisma/client';
import { AppError } from '../middleware/error';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '../config/redis';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CreateMediaInput {
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  folderId?: string;
}

export interface MediaFilters {
  type?: 'image' | 'video' | 'audio' | 'document';
  folderId?: string | null;
  search?: string;
}

// Upload file
export async function uploadFile(
  workspaceId: string,
  uploadedBy: string,
  file: UploadedFile,
  folderId?: string
): Promise<MediaFile> {
  // Generate unique filename
  const ext = path.extname(file.originalname);
  const filename = `${uuidv4()}${ext}`;
  const uploadPath = path.join(config.server.uploadDir, workspaceId, filename);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(uploadPath), { recursive: true });
  
  // Save file
  await fs.writeFile(uploadPath, file.buffer);
  
  // Generate URL (in production, this would be a CDN URL)
  const url = `/uploads/${workspaceId}/${filename}`;
  
  // Create media record
  const media = await prisma.mediaFile.create({
    data: {
      workspaceId,
      uploadedById: uploadedBy,
      filename,
      originalName: file.originalname,
      url,
      mimeType: file.mimetype,
      size: file.size,
      folderId,
    },
  });
  
  await cacheDel(`media:workspace:${workspaceId}:*`);
  return media;
}

// Create media from URL (e.g., AI-generated images)
export async function createMediaFromUrl(
  workspaceId: string,
  uploadedBy: string,
  data: CreateMediaInput
): Promise<MediaFile> {
  const ext = path.extname(data.url) || '.png';
  const filename = `${uuidv4()}${ext}`;
  
  const media = await prisma.mediaFile.create({
    data: {
      workspaceId,
      uploadedById: uploadedBy,
      filename,
      originalName: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      mimeType: data.mimeType,
      size: data.size,
      width: data.width,
      height: data.height,
      duration: data.duration,
      folderId: data.folderId,
    },
  });

  await cacheDel(`media:workspace:${workspaceId}:*`);
  return media;
}

// Get media file by ID
export async function getMediaFileById(mediaId: string) {
  return prisma.mediaFile.findUnique({
    where: { id: mediaId },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      folder: true,
    },
  });
}

// Get workspace media files
export async function getWorkspaceMedia(
  workspaceId: string,
  filters: MediaFilters,
  page: number = 1,
  limit: number = 20
) {
  const queryKey = JSON.stringify({ filters, page, limit });
  const cacheKey = CacheKeys.workspaceMedia(workspaceId, queryKey);
  const cached = await cacheGet<{ files: any[]; total: number }>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = { workspaceId };
  
  if (filters.type) {
    // Filter by mimeType prefix based on type
    const typeMap: Record<string, string> = {
      image: 'image/',
      video: 'video/',
      audio: 'audio/',
      document: 'application/',
    };
    if (typeMap[filters.type]) {
      where.mimeType = { startsWith: typeMap[filters.type] };
    }
  }
  
  if (filters.folderId !== undefined) {
    where.folderId = filters.folderId;
  }
  
  if (filters.search) {
    where.originalName = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }
  
  const [files, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        folder: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mediaFile.count({ where }),
  ]);
  
  const result = { files, total };
  await cacheSet(cacheKey, result, CacheTTL.SHORT);
  return result;
}

// Update media file
export async function updateMediaFile(
  mediaId: string,
  data: {
    originalName?: string;
    folderId?: string | null;
    altText?: string;
  }
): Promise<MediaFile> {
  return prisma.mediaFile.update({
    where: { id: mediaId },
    data,
  });
}

// Delete media file
export async function deleteMediaFile(mediaId: string): Promise<void> {
  const media = await prisma.mediaFile.findUnique({
    where: { id: mediaId },
  });
  
  if (!media) {
    throw new AppError('Media file not found', 404);
  }
  
  // Check if used in posts
  const usageCount = await prisma.postMedia.count({
    where: { mediaFileId: mediaId },
  });
  
  if (usageCount > 0) {
    throw new AppError('Cannot delete media file that is used in posts', 400);
  }
  
  // Delete physical file if stored locally
  if (media.url.startsWith('/uploads')) {
    const filePath = path.join(config.server.uploadDir, media.url.replace('/uploads/', ''));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }
  }
  
  await prisma.mediaFile.delete({
    where: { id: mediaId },
  });

  // Invalidate cache — use URL to get workspaceId from the media record
  if (media.workspaceId) {
    await cacheDel(`media:workspace:${media.workspaceId}:*`);
  }
}

// Create folder
export async function createFolder(
  workspaceId: string,
  _createdBy: string,  // kept for API compatibility but not stored
  name: string,
  parentId?: string
) {
  return prisma.mediaFolder.create({
    data: {
      workspaceId,
      name,
      parentId,
    },
  });
}

// Get workspace folders
export async function getWorkspaceFolders(workspaceId: string, parentId?: string | null) {
  return prisma.mediaFolder.findMany({
    where: {
      workspaceId,
      parentId: parentId ?? null,
    },
    include: {
      _count: {
        select: {
          files: true,
          children: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// Get folder with contents
export async function getFolderWithContents(folderId: string) {
  return prisma.mediaFolder.findUnique({
    where: { id: folderId },
    include: {
      files: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      children: {
        include: {
          _count: {
            select: {
              files: true,
              children: true,
            },
          },
        },
      },
      parent: true,
    },
  });
}

// Update folder
export async function updateFolder(
  folderId: string,
  data: { name?: string; parentId?: string | null }
) {
  return prisma.mediaFolder.update({
    where: { id: folderId },
    data,
  });
}

// Delete folder
export async function deleteFolder(folderId: string, recursive: boolean = false): Promise<void> {
  const folder = await prisma.mediaFolder.findUnique({
    where: { id: folderId },
    include: {
      files: true,
      children: true,
    },
  });
  
  if (!folder) {
    throw new AppError('Folder not found', 404);
  }
  
  if (!recursive && (folder.files.length > 0 || folder.children.length > 0)) {
    throw new AppError('Folder is not empty. Use recursive delete or move contents first.', 400);
  }
  
  if (recursive) {
    // Delete all files in folder
    for (const file of folder.files) {
      await deleteMediaFile(file.id);
    }
    
    // Delete all subfolders
    for (const child of folder.children) {
      await deleteFolder(child.id, true);
    }
  }
  
  await prisma.mediaFolder.delete({
    where: { id: folderId },
  });
}

// Move files to folder
export async function moveFilesToFolder(
  mediaIds: string[],
  folderId: string | null
): Promise<void> {
  await prisma.mediaFile.updateMany({
    where: { id: { in: mediaIds } },
    data: { folderId },
  });
}

// Get media usage stats
export async function getMediaStats(workspaceId: string) {
  const stats = await prisma.mediaFile.groupBy({
    by: ['mimeType'],
    where: { workspaceId },
    _count: { _all: true },
    _sum: { size: true },
  });
  
  const totalSize = await prisma.mediaFile.aggregate({
    where: { workspaceId },
    _sum: { size: true },
    _count: { _all: true },
  });
  
  // Group by type derived from mimeType
  const byType: Record<string, { count: number; size: number }> = {};
  for (const s of stats) {
    const type = getMediaType(s.mimeType);
    if (!byType[type]) {
      byType[type] = { count: 0, size: 0 };
    }
    byType[type].count += s._count?._all || 0;
    byType[type].size += s._sum?.size || 0;
  }
  
  return {
    byType: Object.entries(byType).map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
    })),
    total: {
      count: totalSize._count._all,
      size: totalSize._sum.size || 0,
    },
  };
}

// Helper to determine media type from mime type
function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Duplicate media file
export async function duplicateMediaFile(
  mediaId: string,
  userId: string
): Promise<MediaFile> {
  const original = await prisma.mediaFile.findUnique({
    where: { id: mediaId },
  });
  
  if (!original) {
    throw new AppError('Media file not found', 404);
  }
  
  return prisma.mediaFile.create({
    data: {
      workspaceId: original.workspaceId,
      uploadedById: userId,
      filename: `copy_${original.filename}`,
      originalName: `${original.originalName} (copy)`,
      url: original.url,
      thumbnailUrl: original.thumbnailUrl,
      mimeType: original.mimeType,
      size: original.size,
      width: original.width,
      height: original.height,
      duration: original.duration,
      folderId: original.folderId,
    },
  });
}
