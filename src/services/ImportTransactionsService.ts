import path from 'path';
import fs from 'fs';
import Transaction from '../models/Transaction';
import LoadCsv from '../utils/CsvImportUitl';
import HandleCategoryService from './HandleCategoryService';
import CreateTransactionService from './CreateTransactionService';

class ImportTransactionsService {
  async execute(data: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', `${data}`);
    const csvImport = new LoadCsv();
    const transactions = await csvImport.execute(csvFilePath);
    const insertedTransactions: Transaction[] = [];

    const handleCategoryService = new HandleCategoryService();
    const createTransactionService = new CreateTransactionService();

    await transactions.forEach(async trans => {
      console.log(trans);
      const category_id = await handleCategoryService.execute(trans[3]);

      const transaction = await createTransactionService.execute({
        title: trans[0],
        value: trans[2],
        type: trans[1],
        category_id,
      });
      insertedTransactions.push(transaction);
      console.log('trans');
    });

    fs.unlinkSync(csvFilePath);

    return insertedTransactions;
  }
}

export default ImportTransactionsService;
