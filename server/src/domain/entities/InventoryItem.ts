export type InventoryCategory =
  | 'Lácteos'
  | 'Carnes y Pescados'
  | 'Despensa y Granos'
  | 'Frutas y Verduras'
  | 'Bebidas'
  | 'Congelados'
  | 'Limpieza y Aseo'
  | 'Otros';

export type InventoryLocation = 'Despensa' | 'Refrigerador' | 'Congelador' | 'Lavandería';

export interface InventoryItemProps {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string; // 'unidades', 'kg', 'litros', 'paquetes', 'latas'
  minThreshold: number; // Low stock threshold
  expirationDate?: string; // YYYY-MM-DD
  location: InventoryLocation;
  notes?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export type ExpirationStatus = 'EXPIRED' | 'EXPIRING_SOON' | 'FRESH' | 'NO_EXPIRATION';

export class InventoryItem {
  public readonly id: string;
  public name: string;
  public category: InventoryCategory;
  public quantity: number;
  public unit: string;
  public minThreshold: number;
  public expirationDate?: string;
  public location: InventoryLocation;
  public notes?: string;
  public updatedAt: Date;
  public readonly createdAt: Date;

  constructor(props: InventoryItemProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }
    if (props.quantity < 0) {
      throw new Error('La cantidad no puede ser menor a 0');
    }
    if (props.minThreshold < 0) {
      throw new Error('El stock mínimo no puede ser negativo');
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.category = props.category;
    this.quantity = props.quantity;
    this.unit = props.unit || 'unidades';
    this.minThreshold = props.minThreshold;
    this.expirationDate = props.expirationDate;
    this.location = props.location || 'Despensa';
    this.notes = props.notes;
    this.updatedAt = props.updatedAt || new Date();
    this.createdAt = props.createdAt || new Date();
  }

  public isLowStock(): boolean {
    return this.quantity <= this.minThreshold;
  }

  public isOutOfStock(): boolean {
    return this.quantity === 0;
  }

  public adjustQuantity(delta: number): void {
    const updated = this.quantity + delta;
    if (updated < 0) {
      this.quantity = 0;
    } else {
      this.quantity = Number(updated.toFixed(2));
    }
    this.updatedAt = new Date();
  }

  public getDaysUntilExpiration(): number | null {
    if (!this.expirationDate) return null;
    const exp = new Date(this.expirationDate);
    const today = new Date();
    // Normalize to date boundary
    exp.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getExpirationStatus(): ExpirationStatus {
    const days = this.getDaysUntilExpiration();
    if (days === null) return 'NO_EXPIRATION';
    if (days < 0) return 'EXPIRED';
    if (days <= 3) return 'EXPIRING_SOON';
    return 'FRESH';
  }
}
