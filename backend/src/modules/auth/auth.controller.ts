import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRequest } from '../../types/index.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return ApiResponse.created(res, 'Shop registered successfully', result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return ApiResponse.ok(res, 'Login successful', result);
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    return ApiResponse.ok(res, 'Token refreshed successfully', tokens);
  }
);

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logout(req.user!.userId);
  return ApiResponse.ok(res, 'Logged out successfully');
});
