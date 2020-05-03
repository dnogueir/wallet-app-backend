import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: string;
  value: number;
  category_id: string;
}

class CreateTransactionService {
  public async execute(data: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const balance = await transactionRepository.getBalance();
    console.log(balance);

    if (data.type !== 'outcome' && data.type !== 'income') {
      throw new AppError(
        'the type of transaction can only be outcome or income',
      );
    }

    if (data.type === 'outcome' && balance.total < data.value) {
      throw new AppError(
        'You cannot withdraw this value, it is bigger than the total',
      );
    }

    const transaction = await transactionRepository.create({
      title: data.title,
      type: data.type,
      value: data.value,
      category_id: data.category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
