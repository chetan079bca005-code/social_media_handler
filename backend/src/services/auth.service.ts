import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateTokens, verifyRefreshToken, getExpirationMs } from '../utils/jwt';
import { generateToken } from '../utils/encryption';
import { config } from '../config';
import { Tokens } from '../types';
import { User, Workspace, WorkspaceRole } from '@prisma/client';
import { AppError } from '../middleware/error';
import { generateUniqueSlug } from '../utils/response';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Register new user
export async function registerUser(input: RegisterInput): Promise<{ user: User; tokens: Tokens; workspace: Workspace; workspaces: Workspace[] }> {
  const { email, password, name } = input;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user + default workspace in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        preferences: {
          theme: 'system',
          timezone: 'America/New_York',
          notifications: {
            email: true,
            push: true,
            inApp: true,
            postPublished: true,
            postFailed: true,
            approvalNeeded: true,
            analyticsReport: true,
          },
        },
      },
    });

    const baseWorkspaceName = `${name}'s Workspace`;
    const slug = await generateUniqueSlug(baseWorkspaceName, async (s) => {
      const exists = await tx.workspace.findUnique({ where: { slug: s } });
      return !!exists;
    });

    const workspace = await tx.workspace.create({
      data: {
        name: baseWorkspaceName,
        slug,
        ownerId: user.id,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: WorkspaceRole.OWNER,
      },
    });

    return { user, workspace };
  });

  // Generate tokens
  const tokens = generateTokens({ userId: result.user.id, email: result.user.email });

  // Save refresh token
  await saveRefreshToken(result.user.id, tokens.refreshToken);

  return { user: result.user, tokens, workspace: result.workspace, workspaces: [result.workspace] };
}

// Login user
export async function loginUser(input: LoginInput): Promise<{ user: User; tokens: Tokens; workspaces: Workspace[] }> {
  const { email, password } = input;

  // Find user
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      workspaceMembers: {
        include: { workspace: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Ensure user has a workspace (for older accounts)
  if (!user.workspaceMembers || user.workspaceMembers.length === 0) {
    const baseWorkspaceName = `${user.name}'s Workspace`;
    await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(baseWorkspaceName, async (s) => {
        const exists = await tx.workspace.findUnique({ where: { slug: s } });
        return !!exists;
      });

      const workspace = await tx.workspace.create({
        data: {
          name: baseWorkspaceName,
          slug,
          ownerId: user!.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user!.id,
          role: WorkspaceRole.OWNER,
        },
      });
    });

    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        workspaceMembers: {
          include: { workspace: true },
        },
      },
    });
  }

  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const tokens = generateTokens({ userId: user.id, email: user.email });

  // Save refresh token
  await saveRefreshToken(user.id, tokens.refreshToken);

  const workspaces = (user.workspaceMembers || []).map((m) => m.workspace);

  return { user, tokens, workspaces };
}

// Refresh tokens
export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  
  if (!payload) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token expired or invalid', 401);
  }

  // Delete old refresh token
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  // Generate new tokens
  const tokens = generateTokens({
    userId: storedToken.user.id,
    email: storedToken.user.email,
  });

  // Save new refresh token
  await saveRefreshToken(storedToken.user.id, tokens.refreshToken);

  return tokens;
}

// Logout user (revoke refresh token)
export async function logoutUser(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

// Logout from all devices
export async function logoutAllDevices(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// Change password
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  
  if (!isValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and revoke all tokens
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId },
    }),
  ]);
}

// Request password reset
export async function requestPasswordReset(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if email exists
    return 'If the email exists, a reset link will be sent';
  }

  // Generate reset token
  const resetToken = generateToken(32);
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    },
  });

  // TODO: Send email with reset link
  // For now, return token (in production, send via email)
  return resetToken;
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and clear reset token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    }),
  ]);
}

// Helper: Save refresh token
async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + getExpirationMs(config.jwt.refreshExpiresIn));
  
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Clean up expired tokens
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      expiresAt: { lt: new Date() },
    },
  });
}
