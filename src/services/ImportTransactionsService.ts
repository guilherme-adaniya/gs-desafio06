import { getRepository, getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  csvFile: string;
}

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute({ csvFile }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', csvFile);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);
    const transactions: TransactionCSV[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      const [title, value, type, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !value || !type) return;
      categories.push(category);
      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const existingCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const categoryTitles = existingCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitle = categories
      .filter(category => !categoryTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitle.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);

    const allCategories = { ...newCategories, ...existingCategories };
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(csvFilePath);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
