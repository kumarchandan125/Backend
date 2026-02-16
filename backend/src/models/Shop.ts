import mongoose, { Schema, Document } from 'mongoose';
import type { SubscriptionPlan } from '../types/index.js';

export interface IShop extends Document {
  name: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subscription: {
    plan: SubscriptionPlan;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  };
  settings: {
    currency: string;
    language: string;
  };
}

const shopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'pro'],
        default: 'free',
      },
      startDate: { type: Date, default: Date.now },
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
      isActive: { type: Boolean, default: true },
    },
    settings: {
      currency: { type: String, default: 'INR' },
      language: { type: String, default: 'en' },
    },
  },
  {
    timestamps: true,
  }
);

shopSchema.index({ email: 1 });

export const Shop = mongoose.model<IShop>('Shop', shopSchema);
