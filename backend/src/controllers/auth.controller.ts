import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const result = await authService.registerUser({ name, email, password });

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      workspace: result.workspace,
      workspaces: result.workspaces,
    },
    'User registered successfully',
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.loginUser({ email, password });

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendSuccess(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
    workspaces: result.workspaces,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return sendError(res, 'Refresh token required', 401);
  }

  const result = await authService.refreshTokens(token);

  // Set new refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (token) {
    await authService.logoutUser(token);
  }

  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  await authService.logoutAllDevices(req.user.id);

  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out from all devices');
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user.id, currentPassword, newPassword);

  sendSuccess(res, null, 'Password changed successfully');
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const token = await authService.requestPasswordReset(email);

  // In production, send email with reset link
  // For now, return token (remove in production)
  sendSuccess(res, { token }, 'Password reset instructions sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  await authService.resetPassword(token, newPassword);

  sendSuccess(res, null, 'Password reset successfully');
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  sendSuccess(res, { user: req.user }, 'User retrieved');
});
