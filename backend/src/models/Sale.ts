import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PaymentMethod } from '../types/index.js';

export interface ISaleItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ISale extends Document {
  tenantId: Types.ObjectId;
  invoiceNumber: string;
  items: ISaleItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  createdBy: Types.ObjectId;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
  },
  { _id: false }
);

const saleSchema = new Schema<ISale>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: 'Sale must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card'],
      default: 'cash',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Invoice unique per tenant
saleSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
// Date-range queries for reports
saleSchema.index({ tenantId: 1, createdAt: -1 });

export const Sale = mongoose.model<ISale>('Sale', saleSchema);
