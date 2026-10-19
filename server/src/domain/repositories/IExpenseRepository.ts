import { Expense } from '../entities/Expense';

export interface ExpenseFilter {
  startDate?: string;
  endDate?: string;
  type?: 'SHARED' | 'PERSONAL';
  memberId?: string;
}

export interface IExpenseRepository {
  findAll(filter?: ExpenseFilter): Promise<Expense[]>;
  findById(id: string): Promise<Expense | null>;
  create(expense: Expense): Promise<Expense>;
  update(expense: Expense): Promise<Expense>;
  delete(id: string): Promise<boolean>;
}
