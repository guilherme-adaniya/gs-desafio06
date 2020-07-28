// import AppError from '../errors/AppError';

import { getCustomRepository, DeleteResult } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<DeleteResult> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transactions = transactionRepository.delete({ id });
    return transactions;
  }
}

export default DeleteTransactionService;
