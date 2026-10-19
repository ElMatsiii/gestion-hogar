import { SupabaseClient } from '@supabase/supabase-js';
import { ShoppingItem } from '../../domain/entities/ShoppingItem';
import { IShoppingRepository } from '../../domain/repositories/IShoppingRepository';

export class SupabaseShoppingRepository implements IShoppingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async findAll(): Promise<ShoppingItem[]> {
    const { data, error } = await this.supabase
      .from('shopping_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error en Supabase (shopping): ${error.message}`);
    if (!data) return [];

    return data.map(
      (row) =>
        new ShoppingItem({
          id: row.id,
          name: row.name,
          quantity: Number(row.quantity),
          unit: row.unit,
          isPurchased: Boolean(row.is_purchased),
          inventoryItemId: row.inventory_item_id || undefined,
          category: row.category,
          createdAt: new Date(row.created_at),
        })
    );
  }

  public async findById(id: string): Promise<ShoppingItem | null> {
    const { data, error } = await this.supabase
      .from('shopping_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new ShoppingItem({
      id: data.id,
      name: data.name,
      quantity: Number(data.quantity),
      unit: data.unit,
      isPurchased: Boolean(data.is_purchased),
      inventoryItemId: data.inventory_item_id || undefined,
      category: data.category,
      createdAt: new Date(data.created_at),
    });
  }

  public async create(item: ShoppingItem): Promise<ShoppingItem> {
    const { data, error } = await this.supabase
      .from('shopping_items')
      .insert({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        is_purchased: item.isPurchased,
        inventory_item_id: item.inventoryItemId || null,
        category: item.category,
        created_at: item.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Error agregando artículo a comprar en Supabase: ${error.message}`);

    return new ShoppingItem({
      id: data.id,
      name: data.name,
      quantity: Number(data.quantity),
      unit: data.unit,
      isPurchased: Boolean(data.is_purchased),
      inventoryItemId: data.inventory_item_id || undefined,
      category: data.category,
      createdAt: new Date(data.created_at),
    });
  }

  public async update(item: ShoppingItem): Promise<ShoppingItem> {
    const { data, error } = await this.supabase
      .from('shopping_items')
      .update({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        is_purchased: item.isPurchased,
        category: item.category,
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando artículo en Supabase: ${error.message}`);

    return new ShoppingItem({
      id: data.id,
      name: data.name,
      quantity: Number(data.quantity),
      unit: data.unit,
      isPurchased: Boolean(data.is_purchased),
      inventoryItemId: data.inventory_item_id || undefined,
      category: data.category,
      createdAt: new Date(data.created_at),
    });
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('shopping_items').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando artículo en Supabase: ${error.message}`);
    return true;
  }

  public async deletePurchased(): Promise<number> {
    const { data, error } = await this.supabase
      .from('shopping_items')
      .delete()
      .eq('is_purchased', true)
      .select();

    if (error) throw new Error(`Error eliminando comprados en Supabase: ${error.message}`);
    return data ? data.length : 0;
  }
}
