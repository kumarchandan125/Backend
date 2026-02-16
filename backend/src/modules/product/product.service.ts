import { Product, type IProduct } from '../../models/Product.js';
import { Shop } from '../../models/Shop.js';
import { ApiError } from '../../utils/ApiError.js';
import { PLAN_LIMITS } from '../../utils/constants.js';
import type { SubscriptionPlan, PaginationQuery } from '../../types/index.js';

export class ProductService {
  async getAll(tenantId: string, query: PaginationQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { tenantId, isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(tenantId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      tenantId,
    }).populate('category', 'name');

    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  async create(tenantId: string, data: Partial<IProduct>) {
    // Check plan limits
    await this.checkProductLimit(tenantId);

    const product = await Product.create({ ...data, tenantId });
    return product.populate('category', 'name');
  }

  async update(
    tenantId: string,
    productId: string,
    data: Partial<IProduct>
  ) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  async delete(tenantId: string, productId: string) {
    const product = await Product.findOneAndDelete({
      _id: productId,
      tenantId,
    });
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  async getLowStock(tenantId: string) {
    return Product.find({
      tenantId,
      isActive: true,
      $expr: { $lte: ['$stock.current', '$stock.minimum'] },
    })
      .populate('category', 'name')
      .sort({ 'stock.current': 1 })
      .lean();
  }

  private async checkProductLimit(tenantId: string) {
    const shop = await Shop.findById(tenantId);
    if (!shop) throw ApiError.notFound('Shop not found');

    const plan = shop.subscription.plan as SubscriptionPlan;
    const limit = PLAN_LIMITS[plan].maxProducts;

    if (limit !== Infinity) {
      const count = await Product.countDocuments({ tenantId, isActive: true });
      if (count >= limit) {
        throw ApiError.forbidden(
          `Product limit (${limit}) reached for your '${plan}' plan. Please upgrade.`
        );
      }
    }
  }
}

export const productService = new ProductService();
