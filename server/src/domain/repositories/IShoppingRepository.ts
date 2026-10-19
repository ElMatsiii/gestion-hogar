import { ShoppingItem } from '../entities/ShoppingItem';

export interface IShoppingRepository {
  findAll(): Promise<ShoppingItem[]>;
  findById(id: string): Promise<ShoppingItem | null>;
  create(item: ShoppingItem): Promise<ShoppingItem>;
  update(item: ShoppingItem): Promise<ShoppingItem>;
  delete(id: string): Promise<boolean>;
  deletePurchased(): Promise<number>;
}
