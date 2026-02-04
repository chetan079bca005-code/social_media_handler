import prisma from '../config/database';
import { Workspace, WorkspaceRole } from '@prisma/client';
import { AppError } from '../middleware/error';
import { generateUniqueSlug } from '../utils/response';
import { generateToken } from '../utils/encryption';
import { createNotification } from './user.service';

export interface CreateWorkspaceInput {
  name: string;
  logoUrl?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
}

export interface InviteMemberInput {
  email: string;
  role: WorkspaceRole;
}

// Get workspaces for user
export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return memberships.map((m) => m.workspace);
}

// Create workspace
export async function createWorkspace(
  ownerId: string,
  data: CreateWorkspaceInput
): Promise<Workspace> {
  // Generate unique slug
  const slug = await generateUniqueSlug(data.name, async (s) => {
    const exists = await prisma.workspace.findUnique({ where: { slug: s } });
    return !!exists;
  });

  // Create workspace with owner as member
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug,
      logoUrl: data.logoUrl,
      ownerId,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
      settings: {
        brandColors: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#EC4899',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
      },
      members: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return workspace;
}

// Get workspace by ID
export async function getWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          socialAccounts: true,
          posts: true,
          mediaFiles: true,
          templates: true,
        },
      },
    },
  });
}

// Get workspace by slug
export async function getWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// Update workspace
export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceInput
): Promise<Workspace> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl;
  }

  if (data.settings !== undefined) {
    const currentSettings = workspace.settings as Record<string, unknown>;
    updateData.settings = { ...currentSettings, ...data.settings };
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: updateData,
  });
}

// Delete workspace
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });
}

// Get workspace members
export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { joinedAt: 'asc' },
    ],
  });
}

// Invite member to workspace
export async function inviteMember(
  workspaceId: string,
  invitedBy: string,
  data: InviteMemberInput
) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  // Check if already a member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: { email: data.email.toLowerCase() },
    },
  });

  if (existingMember) {
    throw new AppError('User is already a member of this workspace', 409);
  }

  // Check if already invited
  const existingInvite = await prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId,
      email: data.email.toLowerCase(),
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    throw new AppError('Invitation already sent to this email', 409);
  }

  // Create invitation
  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId,
      email: data.email.toLowerCase(),
      role: data.role,
      token: generateToken(32),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Check if user exists and send notification
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    await createNotification({
      userId: existingUser.id,
      type: 'TEAM_INVITE',
      title: 'Workspace Invitation',
      message: `You've been invited to join ${workspace.name}`,
      data: {
        workspaceId,
        workspaceName: workspace.name,
        invitationToken: invitation.token,
        role: data.role,
      },
    });
  }

  // TODO: Send email invitation

  return invitation;
}

// Accept invitation
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invitation) {
    throw new AppError('Invalid invitation', 400);
  }

  if (invitation.acceptedAt) {
    throw new AppError('Invitation already accepted', 400);
  }

  if (invitation.expiresAt < new Date()) {
    throw new AppError('Invitation expired', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.email !== invitation.email) {
    throw new AppError('This invitation is for a different email address', 403);
  }

  // Add user to workspace
  const [member] = await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      },
      include: {
        workspace: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return member;
}

// Update member role
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
) {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId,
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.role === 'OWNER') {
    throw new AppError('Cannot change owner role', 400);
  }

  return prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// Remove member from workspace
export async function removeMember(workspaceId: string, memberId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId,
    },
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.role === 'OWNER') {
    throw new AppError('Cannot remove workspace owner', 400);
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });
}

// Leave workspace
export async function leaveWorkspace(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!member) {
    throw new AppError('You are not a member of this workspace', 404);
  }

  if (member.role === 'OWNER') {
    throw new AppError('Owner cannot leave the workspace. Transfer ownership first.', 400);
  }

  await prisma.workspaceMember.delete({
    where: { id: member.id },
  });
}

// Transfer ownership
export async function transferOwnership(
  workspaceId: string,
  currentOwnerId: string,
  newOwnerId: string
) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace || workspace.ownerId !== currentOwnerId) {
    throw new AppError('Only the owner can transfer ownership', 403);
  }

  const newOwnerMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: newOwnerId,
      },
    },
  });

  if (!newOwnerMember) {
    throw new AppError('New owner must be a member of the workspace', 400);
  }

  await prisma.$transaction([
    // Update workspace owner
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: newOwnerId },
    }),
    // Update new owner's role
    prisma.workspaceMember.update({
      where: { id: newOwnerMember.id },
      data: { role: 'OWNER' },
    }),
    // Update previous owner's role to admin
    prisma.workspaceMember.updateMany({
      where: {
        workspaceId,
        userId: currentOwnerId,
      },
      data: { role: 'ADMIN' },
    }),
  ]);
}
