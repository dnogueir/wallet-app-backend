import { isUuid } from 'uuidv4';
import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(data: string): Promise<void> {
    if (!isUuid(data)) {
      throw new AppError('Id should be type uuid');
    }

    const transactionsRepository = getCustomRepository(TransactionRepository);

    const transaction = await transactionsRepository.findOne({
      where: {
        id: data,
      },
    });

    if (!transaction) {
      throw new AppError('transaction not found');
    }

    await transactionsRepository.delete(data);
  }
}

export default DeleteTransactionService;
