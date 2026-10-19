import { SupabaseClient } from '@supabase/supabase-js';
import { Subscription } from '../../domain/entities/Subscription';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async findAll(): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .order('billing_day', { ascending: true });

    if (error) throw new Error(`Error en Supabase (subscriptions): ${error.message}`);
    if (!data) return [];

    return data.map(
      (row) =>
        new Subscription({
          id: row.id,
          title: row.title,
          amount: Number(row.amount),
          billingDay: Number(row.billing_day),
          type: row.type,
          assignedToMemberId: row.assigned_to_member_id || undefined,
          isActive: Boolean(row.is_active),
          category: row.category,
          createdAt: new Date(row.created_at),
        })
    );
  }

  public async findById(id: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new Subscription({
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      billingDay: Number(data.billing_day),
      type: data.type,
      assignedToMemberId: data.assigned_to_member_id || undefined,
      isActive: Boolean(data.is_active),
      category: data.category,
      createdAt: new Date(data.created_at),
    });
  }

  public async create(sub: Subscription): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        id: sub.id,
        title: sub.title,
        amount: sub.amount,
        billing_day: sub.billingDay,
        type: sub.type,
        assigned_to_member_id: sub.assignedToMemberId || null,
        is_active: sub.isActive,
        category: sub.category,
        created_at: sub.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Error registrando suscripción en Supabase: ${error.message}`);

    return new Subscription({
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      billingDay: Number(data.billing_day),
      type: data.type,
      assignedToMemberId: data.assigned_to_member_id || undefined,
      isActive: Boolean(data.is_active),
      category: data.category,
      createdAt: new Date(data.created_at),
    });
  }

  public async update(sub: Subscription): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({
        title: sub.title,
        amount: sub.amount,
        billing_day: sub.billingDay,
        type: sub.type,
        assigned_to_member_id: sub.assignedToMemberId || null,
        is_active: sub.isActive,
        category: sub.category,
      })
      .eq('id', sub.id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando suscripción en Supabase: ${error.message}`);

    return new Subscription({
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      billingDay: Number(data.billing_day),
      type: data.type,
      assignedToMemberId: data.assigned_to_member_id || undefined,
      isActive: Boolean(data.is_active),
      category: data.category,
      createdAt: new Date(data.created_at),
    });
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('subscriptions').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando suscripción en Supabase: ${error.message}`);
    return true;
  }
}
