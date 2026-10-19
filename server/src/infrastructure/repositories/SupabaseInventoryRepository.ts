import { SupabaseClient } from '@supabase/supabase-js';
import {
  InventoryItem,
  InventoryCategory,
  InventoryLocation,
} from '../../domain/entities/InventoryItem';
import {
  IInventoryRepository,
  InventoryFilter,
} from '../../domain/repositories/IInventoryRepository';

export class SupabaseInventoryRepository implements IInventoryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async findAll(filter?: InventoryFilter): Promise<InventoryItem[]> {
    let query = this.supabase.from('inventory_items').select('*');

    if (filter) {
      if (filter.category) query = query.eq('category', filter.category);
      if (filter.location) query = query.eq('location', filter.location);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Error en Supabase (inventory): ${error.message}`);
    if (!data) return [];

    let items = data.map(
      (row) =>
        new InventoryItem({
          id: row.id,
          name: row.name,
          category: row.category as InventoryCategory,
          quantity: Number(row.quantity),
          unit: row.unit,
          minThreshold: Number(row.min_threshold),
          expirationDate: row.expiration_date || undefined,
          location: row.location as InventoryLocation,
          notes: row.notes || undefined,
          updatedAt: new Date(row.updated_at),
          createdAt: new Date(row.created_at),
        })
    );

    if (filter?.lowStockOnly) {
      items = items.filter((i) => i.isLowStock());
    }

    return items;
  }

  public async findById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new InventoryItem({
      id: data.id,
      name: data.name,
      category: data.category as InventoryCategory,
      quantity: Number(data.quantity),
      unit: data.unit,
      minThreshold: Number(data.min_threshold),
      expirationDate: data.expiration_date || undefined,
      location: data.location as InventoryLocation,
      notes: data.notes || undefined,
      updatedAt: new Date(data.updated_at),
      createdAt: new Date(data.created_at),
    });
  }

  public async create(item: InventoryItem): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .insert({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        min_threshold: item.minThreshold,
        expiration_date: item.expirationDate || null,
        location: item.location,
        notes: item.notes || null,
        updated_at: item.updatedAt.toISOString(),
        created_at: item.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Error guardando producto en Supabase: ${error.message}`);

    return new InventoryItem({
      id: data.id,
      name: data.name,
      category: data.category as InventoryCategory,
      quantity: Number(data.quantity),
      unit: data.unit,
      minThreshold: Number(data.min_threshold),
      expirationDate: data.expiration_date || undefined,
      location: data.location as InventoryLocation,
      notes: data.notes || undefined,
      updatedAt: new Date(data.updated_at),
      createdAt: new Date(data.created_at),
    });
  }

  public async update(item: InventoryItem): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .update({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        min_threshold: item.minThreshold,
        expiration_date: item.expirationDate || null,
        location: item.location,
        notes: item.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando producto en Supabase: ${error.message}`);

    return new InventoryItem({
      id: data.id,
      name: data.name,
      category: data.category as InventoryCategory,
      quantity: Number(data.quantity),
      unit: data.unit,
      minThreshold: Number(data.min_threshold),
      expirationDate: data.expiration_date || undefined,
      location: data.location as InventoryLocation,
      notes: data.notes || undefined,
      updatedAt: new Date(data.updated_at),
      createdAt: new Date(data.created_at),
    });
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando producto en Supabase: ${error.message}`);
    return true;
  }
}
