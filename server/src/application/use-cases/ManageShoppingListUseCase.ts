import { randomUUID } from 'crypto';
import { ShoppingItem } from '../../domain/entities/ShoppingItem';
import { IShoppingRepository } from '../../domain/repositories/IShoppingRepository';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';

export interface CreateShoppingItemDTO {
  name: string;
  quantity: number;
  unit?: string;
  inventoryItemId?: string;
  category?: string;
}

export class ManageShoppingListUseCase {
  constructor(
    private readonly shoppingRepo: IShoppingRepository,
    private readonly inventoryRepo?: IInventoryRepository
  ) {}

  public async getAll(): Promise<ShoppingItem[]> {
    return this.shoppingRepo.findAll();
  }

  public async create(dto: CreateShoppingItemDTO): Promise<ShoppingItem> {
    const item = new ShoppingItem({
      id: randomUUID(),
      name: dto.name,
      quantity: Number(dto.quantity) || 1,
      unit: dto.unit || 'unidades',
      inventoryItemId: dto.inventoryItemId,
      category: dto.category || 'Supermercado',
      isPurchased: false,
    });

    return this.shoppingRepo.create(item);
  }

  public async togglePurchased(id: string, autoRestock = true): Promise<ShoppingItem> {
    const item = await this.shoppingRepo.findById(id);
    if (!item) {
      throw new Error(`Artículo de compra con id ${id} no encontrado`);
    }

    item.togglePurchased();
    const updated = await this.shoppingRepo.update(item);

    // If marked as purchased and autoRestock is true and has linked inventory item
    if (updated.isPurchased && autoRestock && updated.inventoryItemId && this.inventoryRepo) {
      const inventoryItem = await this.inventoryRepo.findById(updated.inventoryItemId);
      if (inventoryItem) {
        inventoryItem.adjustQuantity(updated.quantity);
        await this.inventoryRepo.update(inventoryItem);
      }
    }

    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    return this.shoppingRepo.delete(id);
  }

  public async clearPurchased(): Promise<number> {
    return this.shoppingRepo.deletePurchased();
  }
}
