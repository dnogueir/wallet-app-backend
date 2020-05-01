import path from 'path';
import fs from 'fs';
import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import LoadCsv from '../utils/CsvImportUitl';
import HandleCategoryService from './HandleCategoryService';
import CreateTransactionService from './CreateTransactionService';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(data: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', `${data}`);
    const csvImport = new LoadCsv();
    const transactions = await csvImport.execute(csvFilePath);
    const insertedTransactions: Transaction[] = [];
    const transactionsToBeInserted: Transaction[] = [];
    const insertedCategories: string[] = [];
    const existingCategoriesTitle: string[] = [];
    const categoryArray: Category[] = [];
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    // getting categories
    transactions.forEach(trans => {
      insertedCategories.push(trans[3]);
    });

    const nonRepeatedCategories = insertedCategories.filter(function (
      elem,
      index,
      self,
    ) {
      return index === self.indexOf(elem);
    });

    const existingCategories = await categoryRepository
      .createQueryBuilder('category')
      .where('category.title IN (:...titles)', {
        titles: nonRepeatedCategories,
      })
      .getMany();

    if (
      existingCategories &&
      existingCategories.length < nonRepeatedCategories.length
    ) {
      existingCategories.forEach(item => {
        existingCategoriesTitle.push(item.title);
      });

      const categoriesToBeInserted = nonRepeatedCategories.filter(category => {
        return !existingCategoriesTitle.includes(category);
      });

      categoriesToBeInserted.forEach(category => {
        const cat = new Category();
        cat.title = category;
        categoryArray.push(cat);
      });

      await categoryRepository
        .createQueryBuilder()
        .insert()
        .into(Category)
        .values(categoryArray)
        .execute();
    }

    // getting categories ids
    const categories = await categoryRepository
      .createQueryBuilder('category')
      .where('category.title IN (:...titles)', {
        titles: nonRepeatedCategories,
      })
      .getMany();

    transactions.forEach(item => {
      const transaction = new Transaction();
      transaction.title = item[0];
      transaction.value = item[2];
      transaction.type = item[1];
      transaction.category = categories.find(
        element => element.title === item[3],
      )?.id;
      transactionsToBeInserted.push(transaction);
    });

    console.log(transactionsToBeInserted);

    const trans = await transactionRepository
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values(transactionsToBeInserted)
      .execute();

    console.log(trans.identifiers);
    const transIds: string[] = [];
    trans.identifiers.forEach(item => {
      transIds.push(item.id);
    });

    const trans2 = await transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.id IN (:...ids)', {
        ids: transIds,
      })
      .getMany();

    fs.unlinkSync(csvFilePath);

    return trans2;
  }
}

export default ImportTransactionsService;
