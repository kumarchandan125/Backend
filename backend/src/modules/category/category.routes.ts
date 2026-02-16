import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', categoryController.getCategories);

router.post(
  '/',
  authorize('owner', 'manager'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  authorize('owner', 'manager'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authorize('owner'),
  categoryController.deleteCategory
);

export default router;
