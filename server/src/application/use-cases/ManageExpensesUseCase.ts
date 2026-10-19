import { randomUUID } from 'crypto';
import { Expense, ExpenseCategory, ExpenseType } from '../../domain/entities/Expense';
import { IExpenseRepository, ExpenseFilter } from '../../domain/repositories/IExpenseRepository';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';

export interface CreateExpenseDTO {
  title: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  paidById: string;
  assignedToMemberId?: string;
  date: string;
  notes?: string;
}

export class ManageExpensesUseCase {
  constructor(
    private readonly expenseRepo: IExpenseRepository,
    private readonly memberRepo: IMemberRepository
  ) {}

  public async getAll(filter?: ExpenseFilter): Promise<Expense[]> {
    return this.expenseRepo.findAll(filter);
  }

  public async create(dto: CreateExpenseDTO): Promise<Expense> {
    // Validate payer exists
    const payer = await this.memberRepo.findById(dto.paidById);
    if (!payer) {
      throw new Error(`El miembro pagador especificado no existe`);
    }

    // Validate assigned member if personal
    if (dto.type === 'PERSONAL') {
      if (!dto.assignedToMemberId) {
        throw new Error('Debe especificar a qué persona pertenece este gasto personal');
      }
      const assigned = await this.memberRepo.findById(dto.assignedToMemberId);
      if (!assigned) {
        throw new Error(`El miembro asignado al gasto personal no existe`);
      }
    }

    const expense = new Expense({
      id: randomUUID(),
      title: dto.title,
      amount: Number(dto.amount),
      category: dto.category,
      type: dto.type,
      paidById: dto.paidById,
      assignedToMemberId: dto.type === 'PERSONAL' ? dto.assignedToMemberId : undefined,
      date: dto.date || new Date().toISOString().split('T')[0],
      notes: dto.notes,
    });

    return this.expenseRepo.create(expense);
  }

  public async delete(id: string): Promise<boolean> {
    return this.expenseRepo.delete(id);
  }
}
