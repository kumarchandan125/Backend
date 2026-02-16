import { Response } from 'express';
import { profileService } from './profile.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRequest } from '../../types/index.js';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await profileService.getProfile(req.user!.userId);
  return ApiResponse.ok(res, 'Profile fetched', data);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const data = await profileService.updateProfile(req.user!.userId, { name, email });
  return ApiResponse.ok(res, 'Profile updated', data);
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await profileService.changePassword(req.user!.userId, currentPassword, newPassword);
  return ApiResponse.ok(res, 'Password changed successfully');
});

export const uploadPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }
  const photoPath = `/uploads/${req.file.filename}`;
  const data = await profileService.uploadPhoto(req.user!.userId, photoPath);
  return ApiResponse.ok(res, 'Photo uploaded', data);
});
