import { SupabaseClient } from '@supabase/supabase-js';
import { Expense } from '../../domain/entities/Expense';
import { IExpenseRepository, ExpenseFilter } from '../../domain/repositories/IExpenseRepository';

export class SupabaseExpenseRepository implements IExpenseRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async findAll(filter?: ExpenseFilter): Promise<Expense[]> {
    let query = this.supabase.from('expenses').select('*');

    if (filter) {
      if (filter.type) query = query.eq('type', filter.type);
      if (filter.memberId) {
        query = query.or(`paid_by_id.eq.${filter.memberId},assigned_to_member_id.eq.${filter.memberId}`);
      }
      if (filter.startDate) query = query.gte('date', filter.startDate);
      if (filter.endDate) query = query.lte('date', filter.endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw new Error(`Error en Supabase (expenses): ${error.message}`);
    if (!data) return [];

    return data.map(
      (row) =>
        new Expense({
          id: row.id,
          title: row.title,
          amount: Number(row.amount),
          category: row.category,
          type: row.type,
          paidById: row.paid_by_id,
          assignedToMemberId: row.assigned_to_member_id || undefined,
          date: row.date,
          notes: row.notes || undefined,
          createdAt: new Date(row.created_at),
        })
    );
  }

  public async findById(id: string): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new Expense({
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      category: data.category,
      type: data.type,
      paidById: data.paid_by_id,
      assignedToMemberId: data.assigned_to_member_id || undefined,
      date: data.date,
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at),
    });
  }

  public async create(expense: Expense): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        type: expense.type,
        paid_by_id: expense.paidById,
        assigned_to_member_id: expense.assignedToMemberId || null,
        date: expense.date,
        notes: expense.notes || null,
        created_at: expense.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Error registrando gasto en Supabase: ${error.message}`);

    return new Expense({
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      category: data.category,
      type: data.type,
      paidById: data.paid_by_id,
      assignedToMemberId: data.assigned_to_member_id || undefined,
      date: data.date,
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at),
    });
  }

  public async update(expense: Expense): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .update({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        type: expense.type,
        paid_by_id: expense.paidById,
        assigned_to_member_id: expense.assignedToMemberId || null,
        date: expense.date,
        notes: expense.notes || null,
      })
      .eq('id', expense.id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando gasto en Supabase: ${error.message}`);

    return new Expense({
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      category: data.category,
      type: data.type,
      paidById: data.paid_by_id,
      assignedToMemberId: data.assigned_to_member_id || undefined,
      date: data.date,
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at),
    });
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando gasto en Supabase: ${error.message}`);
    return true;
  }
}
