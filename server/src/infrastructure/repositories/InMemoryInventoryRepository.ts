import {
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
} from '../../domain/entities/InventoryItem';
import {
  IInventoryRepository,
  InventoryFilter,
} from '../../domain/repositories/IInventoryRepository';

export class InMemoryInventoryRepository implements IInventoryRepository {
  private items: Map<string, InventoryItem> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    // Generate dates relative to today for expiration demonstration
    const today = new Date();
    const addDays = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const seedItems = [
      new InventoryItem({
        id: 'item-1',
        name: 'Leche Entera 1L',
        category: 'Lácteos',
        quantity: 1, // LOW STOCK (min is 3)
        unit: 'litros',
        minThreshold: 3,
        expirationDate: addDays(4), // Expiring soon
        location: 'Refrigerador',
        notes: 'Marca Colun o Soprole',
      }),
      new InventoryItem({
        id: 'item-2',
        name: 'Yogurt Griego Natural',
        category: 'Lácteos',
        quantity: 2,
        unit: 'unidades',
        minThreshold: 4, // LOW STOCK
        expirationDate: addDays(2), // EXPIRING VERY SOON! Rotación prioritaria
        location: 'Refrigerador',
      }),
      new InventoryItem({
        id: 'item-3',
        name: 'Huevos de Gallina Libre (Bandeja)',
        category: 'Despensa y Granos',
        quantity: 4, // LOW STOCK (min is 12)
        unit: 'unidades',
        minThreshold: 12,
        expirationDate: addDays(14),
        location: 'Despensa',
      }),
      new InventoryItem({
        id: 'item-4',
        name: 'Arroz Grado 1 (Bolsa 1kg)',
        category: 'Despensa y Granos',
        quantity: 5, // GOOD STOCK
        unit: 'paquetes',
        minThreshold: 2,
        expirationDate: addDays(180),
        location: 'Despensa',
      }),
      new InventoryItem({
        id: 'item-5',
        name: 'Fideos Spaghetti 400g',
        category: 'Despensa y Granos',
        quantity: 6, // GOOD STOCK
        unit: 'paquetes',
        minThreshold: 2,
        expirationDate: addDays(240),
        location: 'Despensa',
      }),
      new InventoryItem({
        id: 'item-6',
        name: 'Pechuga de Pollo Deshuesada',
        category: 'Carnes y Pescados',
        quantity: 1.2,
        unit: 'kg',
        minThreshold: 1.0,
        expirationDate: addDays(1), // EXPIRING TOMORROW! Consumir de inmediato
        location: 'Refrigerador',
        notes: 'Preparar hoy o pasar a congelador',
      }),
      new InventoryItem({
        id: 'item-7',
        name: 'Carne Molida Tártaro Vacuno',
        category: 'Congelados',
        quantity: 2,
        unit: 'paquetes',
        minThreshold: 1,
        expirationDate: addDays(60),
        location: 'Congelador',
      }),
      new InventoryItem({
        id: 'item-8',
        name: 'Aceite de Oliva Extra Virgen 1L',
        category: 'Despensa y Granos',
        quantity: 0.5, // LOW STOCK
        unit: 'litros',
        minThreshold: 1.0,
        location: 'Despensa',
      }),
      new InventoryItem({
        id: 'item-9',
        name: 'Detergente Líquido Ropa 3L',
        category: 'Limpieza y Aseo',
        quantity: 1,
        unit: 'unidades',
        minThreshold: 1,
        location: 'Lavandería',
      }),
      new InventoryItem({
        id: 'item-10',
        name: 'Papel Higiénico Doble Hoja (Pack)',
        category: 'Limpieza y Aseo',
        quantity: 1, // LOW STOCK
        unit: 'paquetes',
        minThreshold: 2,
        location: 'Lavandería',
        notes: 'Quedan pocos rollos',
      }),
    ];

    seedItems.forEach((i) => this.items.set(i.id, i));
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
