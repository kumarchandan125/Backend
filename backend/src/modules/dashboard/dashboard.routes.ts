import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('owner', 'manager'),
  dashboardController.getDashboard
);

export default router;
