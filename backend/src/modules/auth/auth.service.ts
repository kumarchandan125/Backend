import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { Shop } from '../../models/Shop.js';
import { User, type IUser } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthPayload } from '../../types/index.js';

export class AuthService {
  /**
   * Register a new shop and create the owner user.
   */
  async register(data: {
    shopName: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    city: string;
    state: string;
    pincode: string;
  }) {
    // Check if email already used
    const existingShop = await Shop.findOne({ email: data.email });
    if (existingShop) {
      throw ApiError.conflict('A shop with this email already exists');
    }

    // Create the shop (tenant)
    const shop = await Shop.create({
      name: data.shopName,
      email: data.email,
      phone: data.phone,
      address: {
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    });

    // Create the owner user
    const user = await User.create({
      tenantId: shop._id,
      name: data.ownerName,
      email: data.email,
      password: data.password,
      role: 'owner',
    });

    // Generate tokens
    const tokens = this.generateTokens({
      userId: String(user._id),
      tenantId: String(shop._id),
      role: user.role,
    });

    // Save refresh token
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return {
      shop: {
        id: shop._id,
        name: shop.name,
        email: shop.email,
        plan: shop.subscription.plan,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Login with email and password.
   */
  async login(email: string, password: string) {
    // Find user with password field
    const user = await User.findOne({ email })
      .select('+password')
      .populate('tenantId', 'name subscription');

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = this.generateTokens({
      userId: String(user._id),
      tenantId: String((user.tenantId as any)._id),
      role: user.role,
    });

    // Update refresh token
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop: {
          id: (user.tenantId as any)._id,
          name: (user.tenantId as any).name,
          plan: (user.tenantId as any).subscription?.plan,
        },
      },
      tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshAccessToken(refreshToken: string) {
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as AuthPayload;

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokens = this.generateTokens({
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    });

    // Rotate refresh token
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  /**
   * Logout: clear refresh token.
   */
  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Generate access + refresh token pair.
   */
  private generateTokens(payload: AuthPayload) {
    const tokenPayload = { ...payload };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
