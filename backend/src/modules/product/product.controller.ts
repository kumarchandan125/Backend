import { Response } from 'express';
import { productService } from './product.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRequest } from '../../types/index.js';

export const getProducts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await productService.getAll(req.user!.tenantId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    });
    return ApiResponse.ok(res, 'Products fetched', result);
  }
);

export const getProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const product = await productService.getById(
      req.user!.tenantId,
      req.params.id
    );
    return ApiResponse.ok(res, 'Product fetched', product);
  }
);

export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.file) {
      req.body.photo = `/uploads/${req.file.filename}`;
    }
    const product = await productService.create(req.user!.tenantId, req.body);
    return ApiResponse.created(res, 'Product created', product);
  }
);

export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.file) {
      req.body.photo = `/uploads/${req.file.filename}`;
    }
    const product = await productService.update(
      req.user!.tenantId,
      req.params.id,
      req.body
    );
    return ApiResponse.ok(res, 'Product updated', product);
  }
);

export const deleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await productService.delete(req.user!.tenantId, req.params.id);
    return ApiResponse.ok(res, 'Product deleted');
  }
);

export const getLowStock = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const products = await productService.getLowStock(req.user!.tenantId);
    return ApiResponse.ok(res, 'Low stock products', products);
  }
);
