export interface MemberProps {
  id: string;
  name: string;
  avatarColor: string;
  monthlyIncome: number;
  role: string;
  createdAt?: Date;
}

export class Member {
  public readonly id: string;
  public name: string;
  public avatarColor: string;
  public monthlyIncome: number;
  public role: string;
  public readonly createdAt: Date;

  constructor(props: MemberProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('El nombre del miembro es requerido');
    }
    if (props.monthlyIncome < 0) {
      throw new Error('El ingreso mensual no puede ser negativo');
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.avatarColor = props.avatarColor || '#3B82F6';
    this.monthlyIncome = props.monthlyIncome;
    this.role = props.role || 'Miembro';
    this.createdAt = props.createdAt || new Date();
  }

  public updateIncome(newIncome: number): void {
    if (newIncome < 0) {
      throw new Error('El ingreso mensual no puede ser negativo');
    }
    this.monthlyIncome = newIncome;
  }

  public updateDetails(props: {
    name?: string;
    role?: string;
    avatarColor?: string;
    monthlyIncome?: number;
  }): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) throw new Error('El nombre no puede estar vacío');
      this.name = props.name.trim();
    }
    if (props.role !== undefined) this.role = props.role;
    if (props.avatarColor !== undefined) this.avatarColor = props.avatarColor;
    if (props.monthlyIncome !== undefined) {
      if (props.monthlyIncome < 0) throw new Error('El ingreso mensual no puede ser negativo');
      this.monthlyIncome = Number(props.monthlyIncome);
    }
  }
}
