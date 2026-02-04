import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import prisma from '../config/database';
import { WorkspaceRole } from '@prisma/client';
import { generateUniqueSlug } from '../utils/response';

// Authenticate user from JWT token
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided');
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const payload = verifyAccessToken(token);
    if (!payload) {
      return sendUnauthorized(res, 'Invalid or expired token');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      return sendUnauthorized(res, 'User not found');
    }

    // Attach user to request
    req.user = {
      ...user,
      workspaces: user.workspaceMembers.map(m => ({
        workspace: m.workspace,
        role: m.role,
      })),
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return sendUnauthorized(res, 'Authentication failed');
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      
      if (user) {
        req.user = user;
      }
    }
  }
  
  next();
}

// Require workspace access
export function requireWorkspace(requiredRoles?: WorkspaceRole[]) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId || req.headers['x-workspace-id'];
    
    // Fallback to user's first workspace if no workspaceId provided
    if (!workspaceId) {
      const fallback = req.user.workspaces?.[0];
      if (fallback) {
        // Check role if required
        if (requiredRoles && !requiredRoles.includes(fallback.role)) {
          return sendForbidden(res, 'Insufficient permissions');
        }

        req.workspace = fallback.workspace;
        req.workspaceId = fallback.workspace.id;
        req.workspaceRole = fallback.role;
        return next();
      }

      // Create a default workspace if none exists
      const baseWorkspaceName = `${req.user.name}'s Workspace`;
      const workspace = await prisma.$transaction(async (tx) => {
        const slug = await generateUniqueSlug(baseWorkspaceName, async (s) => {
          const exists = await tx.workspace.findUnique({ where: { slug: s } });
          return !!exists;
        });

        const created = await tx.workspace.create({
          data: {
            name: baseWorkspaceName,
            slug,
            ownerId: req.user!.id,
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: created.id,
            userId: req.user!.id,
            role: WorkspaceRole.OWNER,
          },
        });

        return created;
      });

      req.workspace = workspace;
      req.workspaceId = workspace.id;
      req.workspaceRole = WorkspaceRole.OWNER;
      return next();
    }

    // Check if user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId as string,
          userId: req.user.id,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      // If user owns the workspace but membership is missing, create it
      const owned = await prisma.workspace.findFirst({
        where: { id: workspaceId as string, ownerId: req.user.id },
      });

      if (owned) {
        const created = await prisma.workspaceMember.create({
          data: {
            workspaceId: owned.id,
            userId: req.user.id,
            role: WorkspaceRole.OWNER,
          },
          include: { workspace: true },
        });

        req.workspace = created.workspace;
        req.workspaceId = workspaceId as string;
        req.workspaceRole = created.role;
        return next();
      }

      return sendForbidden(res, 'You do not have access to this workspace');
    }

    // Check role if required
    if (requiredRoles && !requiredRoles.includes(membership.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    req.workspace = membership.workspace;
    req.workspaceId = workspaceId as string;
    req.workspaceRole = membership.role;
    
    next();
  };
}

// Require specific roles
export function requireRole(...roles: WorkspaceRole[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void | Response => {
    if (!req.workspaceRole || !roles.includes(req.workspaceRole)) {
      return sendForbidden(res, 'Insufficient permissions');
    }
    next();
  };
}

// Check if user owns the resource
export function requireOwnership(getOwnerId: (req: AuthRequest) => Promise<string | null>) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    const ownerId = await getOwnerId(req);
    
    if (!ownerId || ownerId !== req.user.id) {
      return sendForbidden(res, 'You do not own this resource');
    }
    
    next();
  };
}
