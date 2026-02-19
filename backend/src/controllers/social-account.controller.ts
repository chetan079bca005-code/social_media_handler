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

  const account = await socialAccountService.updateSocialAccount(accountId, {
    accountName,
    accountUsername,
    profileImageUrl,
    isActive,
  });

  if (!account) {
    return sendError(res, 'Account not found', 404);
  }

  sendSuccess(res, { account }, 'Account updated');
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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(error as string)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/accounts?error=missing_params`);
  }

  try {
    // Decode state to get workspaceId
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { workspaceId } = stateData;

    if (!workspaceId) {
      return res.redirect(`${frontendUrl}/accounts?error=missing_workspace`);
    }

    // Exchange code for tokens and connect the account
    const account = await socialAccountService.handleOAuthCallback(
      platform.toUpperCase() as Parameters<typeof socialAccountService.handleOAuthCallback>[0],
      code as string,
      workspaceId
    );

    res.redirect(
      `${frontendUrl}/accounts?success=true&platform=${platform}&account=${encodeURIComponent(account.accountName || '')}`
    );
  } catch (err: any) {
    console.error(`OAuth callback error for ${platform}:`, err.message);
    res.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(err.message || 'oauth_failed')}`);
  }
});
