export type ExpenseCategory =
  | 'VIVIENDA'
  | 'ALIMENTACION'
  | 'SERVICIOS'
  | 'TRANSPORTE'
  | 'SALUD'
  | 'EDUCACION'
  | 'OCIO'
  | 'SUSCRIPCIONES'
  | 'PERSONAL'
  | 'OTRO';

export type ExpenseType = 'SHARED' | 'PERSONAL';

export interface ExpenseProps {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  paidById: string; // Member who physically paid
  assignedToMemberId?: string; // If PERSONAL, who this belongs to
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: Date;
}

export class Expense {
  public readonly id: string;
  public title: string;
  public amount: number;
  public category: ExpenseCategory;
  public type: ExpenseType;
  public paidById: string;
  public assignedToMemberId?: string;
  public date: string;
  public notes?: string;
  public readonly createdAt: Date;

  constructor(props: ExpenseProps) {
    if (!props.title || props.title.trim() === '') {
      throw new Error('El título del gasto es requerido');
    }
    if (props.amount <= 0) {
      throw new Error('El monto del gasto debe ser mayor a 0');
    }
    if (!props.paidById) {
      throw new Error('Se requiere indicar quién realizó el pago');
    }
    if (props.type === 'PERSONAL' && !props.assignedToMemberId) {
      throw new Error('Un gasto personal debe tener un miembro asignado');
    }

    this.id = props.id;
    this.title = props.title.trim();
    this.amount = props.amount;
    this.category = props.category;
    this.type = props.type;
    this.paidById = props.paidById;
    this.assignedToMemberId = props.type === 'PERSONAL' ? props.assignedToMemberId : undefined;
    this.date = props.date;
    this.notes = props.notes;
    this.createdAt = props.createdAt || new Date();
  }

  public isPersonal(): boolean {
    return this.type === 'PERSONAL';
  }

  public isShared(): boolean {
    return this.type === 'SHARED';
  }
}
