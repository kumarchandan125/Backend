import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/product/product.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import saleRoutes from './modules/sale/sale.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';

const app = express();

// ─── Security & Configuration ─────────────────────────────────
app.set('trust proxy', 1); // Required for Vercel/Proxies
app.use(helmet());

// Improved CORS handling
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
      
      // Auto-allow Vercel deployments (optional, good for preview)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(rateLimiter);

// ─── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Root Route (NEW) ─────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Inventrix Backend is Live 🚀',
    environment: env.NODE_ENV,
  });
});

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Inventrix API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/profile', profileRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler (must be last) ──────────────────────
app.use(errorHandler);

export default app;
