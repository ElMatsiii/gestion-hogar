export interface ShoppingItemProps {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  inventoryItemId?: string;
  category?: string;
  createdAt?: Date;
}

export class ShoppingItem {
  public readonly id: string;
  public name: string;
  public quantity: number;
  public unit: string;
  public isPurchased: boolean;
  public inventoryItemId?: string;
  public category?: string;
  public readonly createdAt: Date;

  constructor(props: ShoppingItemProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('El nombre del artículo a comprar es obligatorio');
    }
    if (props.quantity <= 0) {
      throw new Error('La cantidad a comprar debe ser mayor a 0');
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.quantity = props.quantity;
    this.unit = props.unit || 'unidades';
    this.isPurchased = props.isPurchased ?? false;
    this.inventoryItemId = props.inventoryItemId;
    this.category = props.category || 'Varios';
    this.createdAt = props.createdAt || new Date();
  }

  public togglePurchased(): void {
    this.isPurchased = !this.isPurchased;
  }
}
