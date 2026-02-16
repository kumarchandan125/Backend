import mongoose from 'mongoose';
import { Sale } from '../../models/Sale.js';
import { Product } from '../../models/Product.js';
import { Shop } from '../../models/Shop.js';
import { ApiError } from '../../utils/ApiError.js';
import { PLAN_LIMITS, INVOICE_PREFIX } from '../../utils/constants.js';
import type { SubscriptionPlan, PaymentMethod } from '../../types/index.js';

interface SaleItemInput {
  product: string;
  quantity: number;
}

export class SaleService {
  /**
   * Create a sale — validates stock, deducts it, and records the transaction.
   * Uses a MongoDB transaction for atomicity.
   */
  async create(
    tenantId: string,
    userId: string,
    items: SaleItemInput[],
    paymentMethod: PaymentMethod = 'cash'
  ) {
    // Check monthly sale limit
    await this.checkSaleLimit(tenantId);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const saleItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await Product.findOne({
          _id: item.product,
          tenantId,
          isActive: true,
        }).session(session);

        if (!product) {
          throw ApiError.notFound(`Product not found: ${item.product}`);
        }

        if (product.stock.current < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for "${product.name}". Available: ${product.stock.current}, Requested: ${item.quantity}`
          );
        }

        const lineTotal = product.price.selling * item.quantity;
        saleItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price.selling,
          total: lineTotal,
        });
        totalAmount += lineTotal;

        // Deduct stock
        product.stock.current -= item.quantity;
        await product.save({ session });
      }

      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      const [sale] = await Sale.create(
        [
          {
            tenantId,
            invoiceNumber,
            items: saleItems,
            totalAmount,
            paymentMethod,
            createdBy: userId,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAll(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const { page = 1, limit = 20, startDate, endDate } = query;

    const filter: any = { tenantId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(filter),
    ]);

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(tenantId: string, saleId: string) {
    const sale = await Sale.findOne({ _id: saleId, tenantId }).populate(
      'createdBy',
      'name'
    );
    if (!sale) throw ApiError.notFound('Sale not found');
    return sale;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await Sale.countDocuments({ tenantId });
    const padded = String(count + 1).padStart(6, '0');
    return `${INVOICE_PREFIX}-${padded}`;
  }

  private async checkSaleLimit(tenantId: string) {
    const shop = await Shop.findById(tenantId);
    if (!shop) throw ApiError.notFound('Shop not found');

    const plan = shop.subscription.plan as SubscriptionPlan;
    const limit = PLAN_LIMITS[plan].maxMonthlySales;

    if (limit !== Infinity) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const count = await Sale.countDocuments({
        tenantId,
        createdAt: { $gte: startOfMonth },
      });

      if (count >= limit) {
        throw ApiError.forbidden(
          `Monthly sale limit (${limit}) reached for your '${plan}' plan. Please upgrade.`
        );
      }
    }
  }
}

export const saleService = new SaleService();
