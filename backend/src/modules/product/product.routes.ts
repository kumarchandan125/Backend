import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
} from './product.validation.js';

// Multer storage for product photos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

/**
 * Middleware to parse JSON strings from multipart/form-data.
 * Multer sends all fields as strings, so we parse nested JSON fields
 * and convert numeric strings to numbers for Zod validation.
 */
const parseMultipartBody = (req: Request, _res: Response, next: NextFunction) => {
  const body = req.body;

  // Parse nested JSON fields
  if (typeof body.price === 'string') {
    try { body.price = JSON.parse(body.price); } catch { /* keep as is */ }
  }
  if (typeof body.stock === 'string') {
    try { body.stock = JSON.parse(body.stock); } catch { /* keep as is */ }
  }

  // Convert numeric fields that come as strings
  if (body.price && typeof body.price === 'object') {
    if (typeof body.price.cost === 'string') body.price.cost = Number(body.price.cost);
    if (typeof body.price.selling === 'string') body.price.selling = Number(body.price.selling);
  }
  if (body.stock && typeof body.stock === 'object') {
    if (typeof body.stock.current === 'string') body.stock.current = Number(body.stock.current);
    if (typeof body.stock.minimum === 'string') body.stock.minimum = Number(body.stock.minimum);
  }

  next();
};

const router = Router();

router.use(authenticate);

router.get('/', productController.getProducts);
router.get('/low-stock', productController.getLowStock);
router.get('/:id', productController.getProduct);

router.post(
  '/',
  authorize('owner', 'manager'),
  upload.single('photo'),
  parseMultipartBody,
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authorize('owner', 'manager'),
  upload.single('photo'),
  parseMultipartBody,
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  authorize('owner'),
  productController.deleteProduct
);

export default router;
