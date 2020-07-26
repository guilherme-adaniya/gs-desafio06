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
    const totalIncome = transactions.reduce((total, next) => {
      if (next.type === 'income') {
        return total + Number(next.value);
      }
      return total;
    }, 0);

    const totalOutcome = transactions.reduce((total, next) => {
      if (next.type === 'outcome') {
        return total + Number(next.value);
      }
      return total;
    }, 0);

    const total = totalIncome - totalOutcome;
    return { income: totalIncome, outcome: totalOutcome, total };
  }
}

export default TransactionsRepository;
