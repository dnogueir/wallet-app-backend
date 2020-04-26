import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = transactions
      .filter(({ type }) => type === 'income')
      .reduce((sum, curr) => {
        return sum + curr.value;
      }, 0);

    const outcome = transactions
      .filter(({ type }) => type === 'outcome')
      .reduce((sum, curr) => {
        return sum + curr.value;
      }, 0);

    const total = income - outcome;

    const balance = {
      income,
      outcome,
      total,
    };

    return balance;
  }
}

export default TransactionsRepository;
