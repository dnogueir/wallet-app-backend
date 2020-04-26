import { getRepository } from 'typeorm';
import Category from '../models/Category';

class HandleCategoryService {
  public async execute(categoryName: string): Promise<string> {
    const categoryRepository = getRepository(Category);

    const existingCategory = await categoryRepository.findOne({
      where: {
        title: categoryName,
      },
    });

    if (existingCategory) {
      return existingCategory.id;
    }

    const category = await categoryRepository.create({
      title: categoryName,
    });

    await categoryRepository.save(category);

    return category.id;
  }
}

export default HandleCategoryService;
