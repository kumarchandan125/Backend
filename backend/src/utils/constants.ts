import type { PlanLimits, SubscriptionPlan } from '../types/index.js';

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxProducts: 50,
    maxUsers: 1,
    maxMonthlySales: 100,
  },
  starter: {
    maxProducts: 500,
    maxUsers: 3,
    maxMonthlySales: 1000,
  },
  pro: {
    maxProducts: Infinity,
    maxUsers: 10,
    maxMonthlySales: Infinity,
  },
};

export const SALT_ROUNDS = 12;

export const INVOICE_PREFIX = 'INV';
