import { randomUUID } from 'crypto';
import { Member } from '../../domain/entities/Member';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';

export interface CreateMemberDTO {
  name: string;
  avatarColor?: string;
  monthlyIncome: number;
  role?: string;
}

export interface UpdateMemberDTO {
  name?: string;
  avatarColor?: string;
  monthlyIncome?: number;
  role?: string;
}

export class ManageMembersUseCase {
  constructor(private readonly memberRepo: IMemberRepository) {}

  public async getAll(): Promise<Member[]> {
    return this.memberRepo.findAll();
  }

  public async create(dto: CreateMemberDTO): Promise<Member> {
    const member = new Member({
      id: randomUUID(),
      name: dto.name,
      avatarColor: dto.avatarColor || '#10B981',
      monthlyIncome: Number(dto.monthlyIncome) || 0,
      role: dto.role || 'Miembro',
    });

    return this.memberRepo.create(member);
  }

  public async update(id: string, dto: UpdateMemberDTO): Promise<Member> {
    const member = await this.memberRepo.findById(id);
    if (!member) {
      throw new Error(`Miembro con id ${id} no encontrado`);
    }
    member.updateDetails(dto);
    return this.memberRepo.update(member);
  }

  public async updateIncome(id: string, newIncome: number): Promise<Member> {
    const member = await this.memberRepo.findById(id);
    if (!member) {
      throw new Error(`Miembro con id ${id} no encontrado`);
    }
    member.updateIncome(Number(newIncome));
    return this.memberRepo.update(member);
  }

  public async delete(id: string): Promise<boolean> {
    return this.memberRepo.delete(id);
  }
}
