import { Expense } from '../../domain/entities/Expense';
import { IExpenseRepository, ExpenseFilter } from '../../domain/repositories/IExpenseRepository';

export class InMemoryExpenseRepository implements IExpenseRepository {
  private expenses: Map<string, Expense> = new Map();

  constructor() {
    // Inicializa completamente vacío (sin datos predeterminados)
  }

  public async findAll(filter?: ExpenseFilter): Promise<Expense[]> {
    let list = Array.from(this.expenses.values());

    if (filter) {
      if (filter.type) {
        list = list.filter((e) => e.type === filter.type);
      }
      if (filter.memberId) {
        list = list.filter(
          (e) => e.paidById === filter.memberId || e.assignedToMemberId === filter.memberId
        );
      }
      if (filter.startDate) {
        list = list.filter((e) => e.date >= filter.startDate!);
      }
      if (filter.endDate) {
        list = list.filter((e) => e.date <= filter.endDate!);
      }
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  public async findById(id: string): Promise<Expense | null> {
    return this.expenses.get(id) || null;
  }

  public async create(expense: Expense): Promise<Expense> {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  public async update(expense: Expense): Promise<Expense> {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  public async delete(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }
}
