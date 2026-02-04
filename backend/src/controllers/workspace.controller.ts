import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as workspaceService from '../services/workspace.service';

export const createWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { name, logoUrl } = req.body;

  const workspace = await workspaceService.createWorkspace(req.user.id, {
    name,
    logoUrl,
  });

  sendSuccess(res, { workspace }, 'Workspace created', 201);
});

export const getUserWorkspaces = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const workspaces = await workspaceService.getUserWorkspaces(req.user.id);

  sendSuccess(res, { workspaces }, 'Workspaces retrieved');
});

export const getWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;

  const workspace = await workspaceService.getWorkspaceById(workspaceId);

  if (!workspace) {
    return sendError(res, 'Workspace not found', 404);
  }

  sendSuccess(res, { workspace }, 'Workspace retrieved');
});

export const updateWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const { name, logoUrl, settings } = req.body;

  const workspace = await workspaceService.updateWorkspace(workspaceId, {
    name,
    logoUrl,
    settings,
  });

  sendSuccess(res, { workspace }, 'Workspace updated');
});

export const deleteWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;

  await workspaceService.deleteWorkspace(workspaceId);

  sendSuccess(res, null, 'Workspace deleted');
});

export const getMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;

  const members = await workspaceService.getWorkspaceMembers(workspaceId);

  sendSuccess(res, { members }, 'Members retrieved');
});

export const inviteMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const workspaceId = req.params.workspaceId as string;
  const { email, role } = req.body;

  const invitation = await workspaceService.inviteMember(workspaceId, req.user.id, {
    email,
    role,
  });

  sendSuccess(res, { invitation }, 'Invitation sent', 201);
});

export const acceptInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const token = req.params.token as string;

  const member = await workspaceService.acceptInvitation(token, req.user.id);

  sendSuccess(res, { member }, 'Invitation accepted');
});

export const updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const memberId = req.params.memberId as string;
  const { role } = req.body;

  const member = await workspaceService.updateMemberRole(workspaceId, memberId, role);

  sendSuccess(res, { member }, 'Member role updated');
});

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const memberId = req.params.memberId as string;

  await workspaceService.removeMember(workspaceId, memberId);

  sendSuccess(res, null, 'Member removed');
});

export const leaveWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const workspaceId = req.params.workspaceId as string;

  await workspaceService.leaveWorkspace(workspaceId, req.user.id);

  sendSuccess(res, null, 'Left workspace');
});

export const transferOwnership = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const workspaceId = req.params.workspaceId as string;
  const { newOwnerId } = req.body;

  await workspaceService.transferOwnership(workspaceId, req.user.id, newOwnerId);

  sendSuccess(res, null, 'Ownership transferred');
});
