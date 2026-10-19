import { randomUUID } from 'crypto';
import { Subscription } from '../../domain/entities/Subscription';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';

export interface CreateSubscriptionDTO {
  title: string;
  amount: number;
  billingDay: number;
  type: 'SHARED' | 'PERSONAL';
  assignedToMemberId?: string;
  category?: string;
}

export class ManageSubscriptionsUseCase {
  constructor(
    private readonly subRepo: ISubscriptionRepository,
    private readonly memberRepo: IMemberRepository
  ) {}

  public async getAll(): Promise<Subscription[]> {
    return this.subRepo.findAll();
  }

  public async create(dto: CreateSubscriptionDTO): Promise<Subscription> {
    if (dto.type === 'PERSONAL') {
      if (!dto.assignedToMemberId) {
        throw new Error('Debe asignarse un titular para una suscripción personal');
      }
      const member = await this.memberRepo.findById(dto.assignedToMemberId);
      if (!member) {
        throw new Error('El miembro asignado no existe');
      }
    }

    const sub = new Subscription({
      id: randomUUID(),
      title: dto.title,
      amount: Number(dto.amount),
      billingDay: Number(dto.billingDay),
      type: dto.type,
      assignedToMemberId: dto.assignedToMemberId,
      category: dto.category || 'Servicios / Streaming',
      isActive: true,
    });

    return this.subRepo.create(sub);
  }

  public async toggleActive(id: string): Promise<Subscription> {
    const sub = await this.subRepo.findById(id);
    if (!sub) {
      throw new Error(`Suscripción con id ${id} no encontrada`);
    }
    sub.toggleActive();
    return this.subRepo.update(sub);
  }

  public async delete(id: string): Promise<boolean> {
    return this.subRepo.delete(id);
  }
}
