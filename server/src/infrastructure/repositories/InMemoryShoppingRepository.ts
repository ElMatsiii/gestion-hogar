import { ShoppingItem } from '../../domain/entities/ShoppingItem';
import { IShoppingRepository } from '../../domain/repositories/IShoppingRepository';

export class InMemoryShoppingRepository implements IShoppingRepository {
  private items: Map<string, ShoppingItem> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const seedShopping = [
      new ShoppingItem({
        id: 'shop-1',
        name: 'Leche Entera 1L (Pack x6)',
        quantity: 6,
        unit: 'litros',
        inventoryItemId: 'item-1',
        category: 'Lácteos',
        isPurchased: false,
      }),
      new ShoppingItem({
        id: 'shop-2',
        name: 'Huevos de Gallina Libre',
        quantity: 24,
        unit: 'unidades',
        inventoryItemId: 'item-3',
        category: 'Despensa y Granos',
        isPurchased: false,
      }),
      new ShoppingItem({
        id: 'shop-3',
        name: 'Papel Higiénico 12 rollos',
        quantity: 1,
        unit: 'paquetes',
        inventoryItemId: 'item-10',
        category: 'Limpieza y Aseo',
        isPurchased: true, // Example of already purchased item
      }),
    ];

    seedShopping.forEach((s) => this.items.set(s.id, s));
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
