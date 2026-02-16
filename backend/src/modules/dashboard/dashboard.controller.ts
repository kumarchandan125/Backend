import { Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRequest } from '../../types/index.js';

export const getDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await dashboardService.getDashboard(req.user!.tenantId);
    return ApiResponse.ok(res, 'Dashboard data', data);
  }
);
