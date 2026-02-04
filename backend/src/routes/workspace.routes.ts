import { Router } from 'express';
import { z } from 'zod';
import * as workspaceController from '../controllers/workspace.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid(),
});

// Workspace CRUD
router.get('/', workspaceController.getUserWorkspaces);
router.post('/', validateBody(createWorkspaceSchema), workspaceController.createWorkspace);
router.get('/:workspaceId', requireWorkspace(), workspaceController.getWorkspace);
router.patch('/:workspaceId', requireWorkspace(['OWNER', 'ADMIN']), validateBody(updateWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:workspaceId', requireWorkspace(['OWNER']), workspaceController.deleteWorkspace);

// Members
router.get('/:workspaceId/members', requireWorkspace(), workspaceController.getMembers);
router.post('/:workspaceId/members/invite', requireWorkspace(['OWNER', 'ADMIN']), validateBody(inviteMemberSchema), workspaceController.inviteMember);
router.patch('/:workspaceId/members/:memberId/role', requireWorkspace(['OWNER', 'ADMIN']), validateBody(updateMemberRoleSchema), workspaceController.updateMemberRole);
router.delete('/:workspaceId/members/:memberId', requireWorkspace(['OWNER', 'ADMIN']), workspaceController.removeMember);
router.post('/:workspaceId/leave', requireWorkspace(), workspaceController.leaveWorkspace);
router.post('/:workspaceId/transfer-ownership', requireWorkspace(['OWNER']), validateBody(transferOwnershipSchema), workspaceController.transferOwnership);

// Invitations
router.post('/invitations/:token/accept', workspaceController.acceptInvitation);

export default router;
