import { InventoryCategory, InventoryItem, InventoryLocation } from '../entities/InventoryItem';

export interface InventoryFilter {
  category?: InventoryCategory;
  location?: InventoryLocation;
  lowStockOnly?: boolean;
}

export interface IInventoryRepository {
  findAll(filter?: InventoryFilter): Promise<InventoryItem[]>;
  findById(id: string): Promise<InventoryItem | null>;
  create(item: InventoryItem): Promise<InventoryItem>;
  update(item: InventoryItem): Promise<InventoryItem>;
  delete(id: string): Promise<boolean>;
}
