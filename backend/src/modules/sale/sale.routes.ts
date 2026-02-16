import { Router } from 'express';
import * as saleController from './sale.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createSaleSchema } from './sale.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', saleController.getSales);
router.get('/:id', saleController.getSale);

router.post(
  '/',
  validate(createSaleSchema),
  saleController.createSale
);

export default router;
