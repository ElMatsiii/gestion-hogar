import { SupabaseClient } from '@supabase/supabase-js';
import { Member } from '../../domain/entities/Member';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';

export class SupabaseMemberRepository implements IMemberRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async findAll(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Error en Supabase (members): ${error.message}`);
    if (!data) return [];

    return data.map(
      (row) =>
        new Member({
          id: row.id,
          name: row.name,
          avatarColor: row.avatar_color,
          monthlyIncome: Number(row.monthly_income),
          role: row.role,
          createdAt: new Date(row.created_at),
        })
    );
  }

  public async findById(id: string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new Member({
      id: data.id,
      name: data.name,
      avatarColor: data.avatar_color,
      monthlyIncome: Number(data.monthly_income),
      role: data.role,
      createdAt: new Date(data.created_at),
    });
  }

  public async create(member: Member): Promise<Member> {
    const { data, error } = await this.supabase
      .from('members')
      .insert({
        id: member.id,
        name: member.name,
        avatar_color: member.avatarColor,
        monthly_income: member.monthlyIncome,
        role: member.role,
        created_at: member.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Error creando miembro en Supabase: ${error.message}`);

    return new Member({
      id: data.id,
      name: data.name,
      avatarColor: data.avatar_color,
      monthlyIncome: Number(data.monthly_income),
      role: data.role,
      createdAt: new Date(data.created_at),
    });
  }

  public async update(member: Member): Promise<Member> {
    const { data, error } = await this.supabase
      .from('members')
      .update({
        name: member.name,
        avatar_color: member.avatarColor,
        monthly_income: member.monthlyIncome,
        role: member.role,
      })
      .eq('id', member.id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando miembro en Supabase: ${error.message}`);

    return new Member({
      id: data.id,
      name: data.name,
      avatarColor: data.avatar_color,
      monthlyIncome: Number(data.monthly_income),
      role: data.role,
      createdAt: new Date(data.created_at),
    });
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('members').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando miembro en Supabase: ${error.message}`);
    return true;
  }
}
