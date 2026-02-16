import { Response } from 'express';
import { categoryService } from './category.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRequest } from '../../types/index.js';

export const getCategories = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const categories = await categoryService.getAll(req.user!.tenantId);
    return ApiResponse.ok(res, 'Categories fetched', categories);
  }
);

export const createCategory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const category = await categoryService.create(
      req.user!.tenantId,
      req.body
    );
    return ApiResponse.created(res, 'Category created', category);
  }
);

export const updateCategory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const category = await categoryService.update(
      req.user!.tenantId,
      req.params.id,
      req.body
    );
    return ApiResponse.ok(res, 'Category updated', category);
  }
);

export const deleteCategory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await categoryService.delete(req.user!.tenantId, req.params.id);
    return ApiResponse.ok(res, 'Category deleted');
  }
);
