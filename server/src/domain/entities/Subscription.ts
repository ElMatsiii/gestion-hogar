export interface SubscriptionProps {
  id: string;
  title: string;
  amount: number;
  billingDay: number; // 1-31
  type: 'SHARED' | 'PERSONAL';
  assignedToMemberId?: string; // If personal
  isActive: boolean;
  category: string;
  createdAt?: Date;
}

export class Subscription {
  public readonly id: string;
  public title: string;
  public amount: number;
  public billingDay: number;
  public type: 'SHARED' | 'PERSONAL';
  public assignedToMemberId?: string;
  public isActive: boolean;
  public category: string;
  public readonly createdAt: Date;

  constructor(props: SubscriptionProps) {
    if (!props.title || props.title.trim() === '') {
      throw new Error('El nombre de la suscripción es obligatorio');
    }
    if (props.amount <= 0) {
      throw new Error('El monto de la suscripción debe ser positivo');
    }
    if (props.billingDay < 1 || props.billingDay > 31) {
      throw new Error('El día de cobro debe estar entre 1 y 31');
    }
    if (props.type === 'PERSONAL' && !props.assignedToMemberId) {
      throw new Error('Las suscripciones personales deben asignarse a una persona');
    }

    this.id = props.id;
    this.title = props.title.trim();
    this.amount = props.amount;
    this.billingDay = props.billingDay;
    this.type = props.type;
    this.assignedToMemberId = props.assignedToMemberId;
    this.isActive = props.isActive ?? true;
    this.category = props.category || 'Streaming / Servicios';
    this.createdAt = props.createdAt || new Date();
  }

  public toggleActive(): void {
    this.isActive = !this.isActive;
  }
}
