import prisma from '../config/database';
import { SocialPlatform } from '@prisma/client';
import { AppError } from '../middleware/error';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '../config/redis';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content: string;
  category?: string;
  platforms?: SocialPlatform[];
  tags?: string[];
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  content?: string;
  category?: string;
  platforms?: SocialPlatform[];
  tags?: string[];
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export async function getTemplates(
  workspaceId: string,
  filters?: { category?: string; search?: string; isPublic?: boolean }
) {
  const queryKey = JSON.stringify(filters || {});
  const cacheKey = CacheKeys.workspaceTemplates(workspaceId, queryKey);
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  const where: any = {
    OR: [
      { workspaceId },
      { isPublic: true },
    ],
  };

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } },
          { tags: { hasSome: [filters.search.toLowerCase()] } },
        ],
      },
    ];
  }

  const templates = await prisma.template.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [
      { usageCount: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  await cacheSet(cacheKey, templates, CacheTTL.DEFAULT);
  return templates;
}

export async function getTemplateById(id: string) {
  const cacheKey = CacheKeys.template(id);
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return cached;

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (template) await cacheSet(cacheKey, template, CacheTTL.DEFAULT);
  return template;
}

export async function createTemplate(
  workspaceId: string,
  userId: string,
  data: CreateTemplateInput
) {
  const created = await prisma.template.create({
    data: {
      workspaceId,
      createdById: userId,
      name: data.name,
      description: data.description || '',
      content: data.content,
      category: data.category || 'general',
      platforms: data.platforms || [],
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      metadata: (data.metadata as any) || {},
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  await cacheDel(`templates:workspace:${workspaceId}:*`);
  return created;
}

export async function updateTemplate(
  id: string,
  workspaceId: string,
  data: UpdateTemplateInput
) {
  const template = await prisma.template.findFirst({
    where: { id, workspaceId },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.platforms !== undefined && { platforms: data.platforms }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.metadata !== undefined && { metadata: data.metadata as any }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  await cacheDel(CacheKeys.template(id));
  await cacheDel(`templates:workspace:${workspaceId}:*`);
  return updated;
}

export async function deleteTemplate(id: string, workspaceId: string) {
  const template = await prisma.template.findFirst({
    where: { id, workspaceId },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  await prisma.template.delete({ where: { id } });
  await cacheDel(CacheKeys.template(id));
  await cacheDel(`templates:workspace:${workspaceId}:*`);
}

export async function incrementUsageCount(id: string) {
  return prisma.template.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });
}

export async function getCategories(workspaceId: string) {
  const templates = await prisma.template.findMany({
    where: { OR: [{ workspaceId }, { isPublic: true }] },
    select: { category: true },
    distinct: ['category'],
  });

  return templates.map((t) => t.category).filter(Boolean);
}
