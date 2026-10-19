import { ShoppingItem } from '../../domain/entities/ShoppingItem';
import { IShoppingRepository } from '../../domain/repositories/IShoppingRepository';

export class InMemoryShoppingRepository implements IShoppingRepository {
  private items: Map<string, ShoppingItem> = new Map();

  constructor() {
    // Inicializa completamente vacío (sin datos predeterminados)
  }

  public async findAll(): Promise<ShoppingItem[]> {
    return Array.from(this.items.values());
  }

  public async findById(id: string): Promise<ShoppingItem | null> {
    return this.items.get(id) || null;
  }

  public async create(item: ShoppingItem): Promise<ShoppingItem> {
    this.items.set(item.id, item);
    return item;
  }

  public async update(item: ShoppingItem): Promise<ShoppingItem> {
    this.items.set(item.id, item);
    return item;
  }

  public async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  public async deletePurchased(): Promise<number> {
    let deletedCount = 0;
    for (const [id, item] of this.items.entries()) {
      if (item.isPurchased) {
        this.items.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }
}
