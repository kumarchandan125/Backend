import { Category, type ICategory } from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';

export class CategoryService {
  async getAll(tenantId: string) {
    return Category.find({ tenantId }).sort({ name: 1 }).lean();
  }

  async create(tenantId: string, data: Partial<ICategory>) {
    return Category.create({ ...data, tenantId });
  }

  async update(
    tenantId: string,
    categoryId: string,
    data: Partial<ICategory>
  ) {
    const category = await Category.findOneAndUpdate(
      { _id: categoryId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  async delete(tenantId: string, categoryId: string) {
    const category = await Category.findOneAndDelete({
      _id: categoryId,
      tenantId,
    });
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }
}

export const categoryService = new CategoryService();
