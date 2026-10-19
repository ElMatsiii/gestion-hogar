import { Expense } from '../../domain/entities/Expense';
import { IExpenseRepository, ExpenseFilter } from '../../domain/repositories/IExpenseRepository';

export class InMemoryExpenseRepository implements IExpenseRepository {
  private expenses: Map<string, Expense> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const today = new Date().toISOString().split('T')[0];
    const seedExpenses = [
      new Expense({
        id: 'exp-1',
        title: 'Dividendo / Arriendo Casa',
        amount: 650000,
        category: 'VIVIENDA',
        type: 'SHARED',
        paidById: 'member-1',
        date: today,
        notes: 'Gasto compartido familiar',
      }),
      new Expense({
        id: 'exp-2',
        title: 'Supermercado Central - Compra del mes',
        amount: 320000,
        category: 'ALIMENTACION',
        type: 'SHARED',
        paidById: 'member-2',
        date: today,
        notes: 'Comestibles e insumos para el hogar',
      }),
      new Expense({
        id: 'exp-3',
        title: 'Cuenta Luz y Agua',
        amount: 85000,
        category: 'SERVICIOS',
        type: 'SHARED',
        paidById: 'member-1',
        date: today,
      }),
      new Expense({
        id: 'exp-4',
        title: 'Internet Fibra Óptica Hogar',
        amount: 28990,
        category: 'SERVICIOS',
        type: 'SHARED',
        paidById: 'member-3',
        date: today,
      }),
      new Expense({
        id: 'exp-5',
        title: 'Gimnasio SmartFit (Matías)',
        amount: 25900,
        category: 'PERSONAL',
        type: 'PERSONAL',
        paidById: 'member-3',
        assignedToMemberId: 'member-3',
        date: today,
        notes: 'Gasto obligatorio personal de Matías',
      }),
      new Expense({
        id: 'exp-6',
        title: 'Plan Teléfono Móvil Marcela',
        amount: 14990,
        category: 'PERSONAL',
        type: 'PERSONAL',
        paidById: 'member-2',
        assignedToMemberId: 'member-2',
        date: today,
      }),
      new Expense({
        id: 'exp-7',
        title: 'Curso Inglés Carlos',
        amount: 45000,
        category: 'EDUCACION',
        type: 'PERSONAL',
        paidById: 'member-1',
        assignedToMemberId: 'member-1',
        date: today,
      }),
    ];

    seedExpenses.forEach((e) => this.expenses.set(e.id, e));
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
