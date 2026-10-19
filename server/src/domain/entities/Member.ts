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
}
