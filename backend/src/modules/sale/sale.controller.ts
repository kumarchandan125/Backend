import { Response } from 'express';
import { saleService } from './sale.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRequest } from '../../types/index.js';

export const createSale = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sale = await saleService.create(
      req.user!.tenantId,
      req.user!.userId,
      req.body.items,
      req.body.paymentMethod
    );
    return ApiResponse.created(res, 'Sale recorded', sale);
  }
);

export const getSales = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await saleService.getAll(req.user!.tenantId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    return ApiResponse.ok(res, 'Sales fetched', result);
  }
);

export const getSale = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sale = await saleService.getById(
      req.user!.tenantId,
      req.params.id
    );
    return ApiResponse.ok(res, 'Sale fetched', sale);
  }
);
