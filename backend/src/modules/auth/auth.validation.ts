import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    shopName: z
      .string()
      .min(2, 'Shop name must be at least 2 characters')
      .max(100, 'Shop name cannot exceed 100 characters'),
    ownerName: z
      .string()
      .min(2, 'Owner name must be at least 2 characters')
      .max(80, 'Owner name cannot exceed 80 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z
      .string()
      .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
