import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export type UserRole = 'owner' | 'manager' | 'staff';

export type SubscriptionPlan = 'free' | 'starter' | 'pro';

export type PaymentMethod = 'cash' | 'upi' | 'card';

export type ProductUnit = 'pcs' | 'kg' | 'litre' | 'box' | 'pack';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PlanLimits {
  maxProducts: number;
  maxUsers: number;
  maxMonthlySales: number;
}
