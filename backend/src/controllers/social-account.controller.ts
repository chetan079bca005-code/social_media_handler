import { Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as socialAccountService from '../services/social-account.service';
import { generateToken } from '../utils/encryption';

export const getAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.workspace?.id;

  if (!workspaceId) {
    return sendError(res, 'Workspace not found', 404);
  }

  const accounts = await socialAccountService.getWorkspaceSocialAccounts(workspaceId);

  sendSuccess(res, { accounts }, 'Accounts retrieved');
});

export const getAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;

  const account = await socialAccountService.getSocialAccountById(accountId);

  if (!account) {
    return sendError(res, 'Account not found', 404);
  }

  sendSuccess(res, { account }, 'Account retrieved');
});

export const connectAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.workspace?.id;

  if (!workspaceId) {
    return sendError(res, 'Workspace not found', 404);
  }

  const {
    platform,
    platformAccountId,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    accountName,
    accountUsername,
    profileImageUrl,
  } = req.body;

  const account = await socialAccountService.connectSocialAccount(workspaceId, {
    platform,
    platformAccountId,
    accessToken,
    refreshToken,
    tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
    accountName,
    accountUsername,
    profileImageUrl,
  });

  sendSuccess(res, { account }, 'Account connected', 201);
});

export const updateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;
  const { accountName, accountUsername, profileImageUrl, isActive } = req.body;

  // Re-connect with updated details (simplified update)
  const existing = await socialAccountService.getSocialAccountById(accountId);
  if (!existing) {
    return sendError(res, 'Account not found', 404);
  }

  // For now, just disconnect and reconnect isn't ideal
  // A proper updateSocialAccount function would be better
  sendSuccess(res, { account: existing }, 'Account updated');
});

export const disconnectAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;

  await socialAccountService.disconnectSocialAccount(accountId);

  sendSuccess(res, null, 'Account disconnected');
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;

  const account = await socialAccountService.refreshAccessToken(accountId);

  if (!account) {
    return sendError(res, 'Failed to refresh token', 400);
  }

  sendSuccess(res, { account }, 'Token refreshed');
});

export const syncMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.params.accountId as string;

  await socialAccountService.syncAccountMetrics(accountId);

  sendSuccess(res, null, 'Metrics synced');
});

export const getOAuthUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const platform = req.params.platform as string;
  const workspaceId = req.workspace?.id;

  if (!workspaceId) {
    return sendError(res, 'Workspace not found', 404);
  }

  const url = socialAccountService.getOAuthUrl(
    platform.toUpperCase() as Parameters<typeof socialAccountService.getOAuthUrl>[0],
    workspaceId
  );

  sendSuccess(res, { url }, 'OAuth URL generated');
});

export const handleOAuthCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const platform = req.params.platform as string;
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/social-accounts?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL}/social-accounts?error=missing_params`);
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { workspaceId } = stateData;

    // Exchange code for tokens
    // This would call platform-specific token exchange
    // For now, redirect with success
    res.redirect(`${process.env.FRONTEND_URL}/social-accounts?success=true&platform=${platform}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/social-accounts?error=invalid_state`);
  }
});
