import { randomUUID } from 'crypto';
import {
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
  ExpirationStatus,
} from '../../domain/entities/InventoryItem';
import {
  IInventoryRepository,
  InventoryFilter,
} from '../../domain/repositories/IInventoryRepository';
import { IShoppingRepository } from '../../domain/repositories/IShoppingRepository';
import { ShoppingItem } from '../../domain/entities/ShoppingItem';

export interface CreateInventoryItemDTO {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  expirationDate?: string;
  location: InventoryLocation;
  notes?: string;
}

export interface InventoryItemDTO {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  expirationDate?: string;
  location: InventoryLocation;
  notes?: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  daysUntilExpiration: number | null;
  expirationStatus: ExpirationStatus;
  updatedAt: Date;
}

export class ManageInventoryUseCase {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly shoppingRepo?: IShoppingRepository
  ) {}

  public async getAll(filter?: InventoryFilter): Promise<InventoryItemDTO[]> {
    const items = await this.inventoryRepo.findAll(filter);

    return items
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minThreshold: item.minThreshold,
        expirationDate: item.expirationDate,
        location: item.location,
        notes: item.notes,
        isLowStock: item.isLowStock(),
        isOutOfStock: item.isOutOfStock(),
        daysUntilExpiration: item.getDaysUntilExpiration(),
        expirationStatus: item.getExpirationStatus(),
        updatedAt: item.updatedAt,
      }))
      .sort((a, b) => {
        // Prioritize: Expired / Expiring Soon first (FIFO / Food rotation)
        const getPriority = (status: ExpirationStatus) => {
          switch (status) {
            case 'EXPIRED':
              return 1;
            case 'EXPIRING_SOON':
              return 2;
            case 'FRESH':
              return 3;
            case 'NO_EXPIRATION':
              return 4;
          }
        };
        const pA = getPriority(a.expirationStatus);
        const pB = getPriority(b.expirationStatus);
        if (pA !== pB) return pA - pB;

        // Then low stock
        if (a.isLowStock && !b.isLowStock) return -1;
        if (!a.isLowStock && b.isLowStock) return 1;

        return a.name.localeCompare(b.name);
      });
  }

  public async create(dto: CreateInventoryItemDTO): Promise<InventoryItem> {
    const item = new InventoryItem({
      id: randomUUID(),
      name: dto.name,
      category: dto.category,
      quantity: Number(dto.quantity),
      unit: dto.unit || 'unidades',
      minThreshold: Number(dto.minThreshold) || 1,
      expirationDate: dto.expirationDate,
      location: dto.location || 'Despensa',
      notes: dto.notes,
    });

    const saved = await this.inventoryRepo.create(item);

    // If item is created with low stock, automatically suggest it in the shopping list if repo provided
    if (saved.isLowStock() && this.shoppingRepo) {
      const shoppingItems = await this.shoppingRepo.findAll();
      const alreadyInList = shoppingItems.some((s) => s.inventoryItemId === saved.id);
      if (!alreadyInList) {
        await this.shoppingRepo.create(
          new ShoppingItem({
            id: randomUUID(),
            name: saved.name,
            quantity: Math.max(1, saved.minThreshold * 2 - saved.quantity),
            unit: saved.unit,
            inventoryItemId: saved.id,
            category: saved.category,
            isPurchased: false,
          })
        );
      }
    }

    return saved;
  }

  public async adjustStock(id: string, delta: number): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) {
      throw new Error(`Producto con id ${id} no encontrado`);
    }

    item.adjustQuantity(delta);
    const updated = await this.inventoryRepo.update(item);

    // If it dropped to low stock and shopping repo exists, auto add to shopping list
    if (updated.isLowStock() && this.shoppingRepo) {
      const shoppingList = await this.shoppingRepo.findAll();
      const existing = shoppingList.find((s) => s.inventoryItemId === updated.id);
      if (!existing) {
        await this.shoppingRepo.create(
          new ShoppingItem({
            id: randomUUID(),
            name: updated.name,
            quantity: Math.max(1, updated.minThreshold * 2 - updated.quantity),
            unit: updated.unit,
            inventoryItemId: updated.id,
            category: updated.category,
            isPurchased: false,
          })
        );
      }
    }

    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    return this.inventoryRepo.delete(id);
  }
}
