import { Product } from '../../models/Product.js';
import { Sale } from '../../models/Sale.js';
import mongoose from 'mongoose';

export class DashboardService {
  async getDashboard(tenantId: string) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    const [
      totalProducts,
      lowStockProducts,
      todayRevenue,
      monthRevenue,
      topSellingProducts,
      recentSales,
    ] = await Promise.all([
      // Total active products
      Product.countDocuments({ tenantId, isActive: true }),

      // Low stock products
      Product.find({
        tenantId,
        isActive: true,
        $expr: { $lte: ['$stock.current', '$stock.minimum'] },
      })
        .select('name stock.current stock.minimum unit')
        .sort({ 'stock.current': 1 })
        .limit(10)
        .lean(),

      // Today's revenue
      this.getRevenueForPeriod(tenantObjectId, 'today'),

      // This month's revenue
      this.getRevenueForPeriod(tenantObjectId, 'month'),

      // Top 5 selling products (last 30 days)
      this.getTopSellingProducts(tenantObjectId, 5),

      // Recent 5 sales
      Sale.find({ tenantId })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      revenue: {
        today: todayRevenue,
        month: monthRevenue,
      },
      topSellingProducts,
      recentSales,
    };
  }

  private async getRevenueForPeriod(
    tenantId: mongoose.Types.ObjectId,
    period: 'today' | 'month'
  ): Promise<number> {
    const start = new Date();
    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }

    const result = await Sale.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    return result[0]?.total || 0;
  }

  private async getTopSellingProducts(
    tenantId: mongoose.Types.ObjectId,
    limit: number
  ) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Sale.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);
  }
}

export const dashboardService = new DashboardService();
