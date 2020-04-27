import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import HandleCategoryService from '../services/HandleCategoryService';
import CreateTransactionService from '../services/CreateTransactionService';
import fileConfig from '../config/fileHandle';

const transactionsRouter = Router();

const fileHandle = multer(fileConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionRepository.find();
  const balance = await transactionRepository.getBalance();

  return response.status(200).json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const handleCategoryService = new HandleCategoryService();
  const createTransactionService = new CreateTransactionService();

  const category_id = await handleCategoryService.execute(category);

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category_id,
  });

  return response.status(200).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  fileHandle.single('transactions'),
  async (request, response) => {
    const importTransactionService = new ImportTransactionsService();

    const transactions = await importTransactionService.execute(
      request.file.filename,
    );

    return response.status(200).json(transactions);
  },
);

export default transactionsRouter;
