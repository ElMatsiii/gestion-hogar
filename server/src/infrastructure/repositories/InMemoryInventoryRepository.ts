import { InventoryItem } from '../../domain/entities/InventoryItem';
import {
  IInventoryRepository,
  InventoryFilter,
} from '../../domain/repositories/IInventoryRepository';

export class InMemoryInventoryRepository implements IInventoryRepository {
  private items: Map<string, InventoryItem> = new Map();

  constructor() {
    // Inicializa completamente vacío (sin datos predeterminados)
  }

  public async findAll(filter?: InventoryFilter): Promise<InventoryItem[]> {
    let list = Array.from(this.items.values());

    if (filter) {
      if (filter.category) {
        list = list.filter((i) => i.category === filter.category);
      }
      if (filter.location) {
        list = list.filter((i) => i.location === filter.location);
      }
      if (filter.lowStockOnly) {
        list = list.filter((i) => i.isLowStock());
      }
    }

    return list;
  }

  public async findById(id: string): Promise<InventoryItem | null> {
    return this.items.get(id) || null;
  }

  public async create(item: InventoryItem): Promise<InventoryItem> {
    this.items.set(item.id, item);
    return item;
  }

  public async update(item: InventoryItem): Promise<InventoryItem> {
    this.items.set(item.id, item);
    return item;
  }

  public async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
