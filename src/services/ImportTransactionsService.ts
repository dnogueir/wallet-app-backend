import path from 'path';
import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface RealTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_id: string;
}

class ImportTransactionsService {
  async execute(data: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', `${data}`);
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      transactions.push({ title, type, value, category });
      categories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToBeAdded = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = await categoryRepository.create(
      categoriesToBeAdded.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];
    console.log(transactions);
    console.log(finalCategories);

    const finalTransactions: RealTransaction[] = [];
    transactions.forEach(transaction => {
      const categoryId = finalCategories.find(
        category => category.title === transaction.category,
      );
      let finalCategoryId = '';
      if (categoryId) {
        finalCategoryId = categoryId.id;
      }
      finalTransactions.push({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id: finalCategoryId,
      });
    });

    const createdTransctions = transactionRepository.create(
      finalTransactions.map(item => ({
        title: item.title,
        type: item.type,
        value: item.value,
        category_id: item.category_id,
      })),
    );

    await transactionRepository.save(createdTransctions);

    fs.unlinkSync(csvFilePath);

    return createdTransctions;
  }
}

export default ImportTransactionsService;
