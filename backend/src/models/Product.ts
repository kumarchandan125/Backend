import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ProductUnit } from '../types/index.js';

export interface IProduct extends Document {
  tenantId: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  category: Types.ObjectId;
  price: {
    cost: number;
    selling: number;
  };
  stock: {
    current: number;
    minimum: number;
  };
  unit: ProductUnit;
  photo?: string;
  isActive: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    price: {
      cost: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: [0, 'Cost price cannot be negative'],
      },
      selling: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Selling price cannot be negative'],
      },
    },
    stock: {
      current: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative'],
      },
      minimum: {
        type: Number,
        required: true,
        default: 10,
        min: [0, 'Minimum stock cannot be negative'],
      },
    },
    unit: {
      type: String,
      enum: ['pcs', 'kg', 'litre', 'box', 'pack'],
      default: 'pcs',
    },
    photo: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// SKU is unique per tenant
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
// Text index for search
productSchema.index({ name: 'text', sku: 'text' });
// Low stock query optimization
productSchema.index({ tenantId: 1, 'stock.current': 1, 'stock.minimum': 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
