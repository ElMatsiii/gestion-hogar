import { Subscription } from '../../domain/entities/Subscription';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const seedSubs = [
      new Subscription({
        id: 'sub-1',
        title: 'Netflix 4K Familiar',
        amount: 11990,
        billingDay: 5,
        type: 'SHARED',
        isActive: true,
        category: 'Streaming',
      }),
      new Subscription({
        id: 'sub-2',
        title: 'Spotify Familiar',
        amount: 9990,
        billingDay: 12,
        type: 'SHARED',
        isActive: true,
        category: 'Música',
      }),
      new Subscription({
        id: 'sub-3',
        title: 'Google One Almacenamiento 2TB',
        amount: 8500,
        billingDay: 18,
        type: 'PERSONAL',
        assignedToMemberId: 'member-1', // Carlos
        isActive: true,
        category: 'Nube / Trabajo',
      }),
      new Subscription({
        id: 'sub-4',
        title: 'Platzi Expert Anual (Mensualizado)',
        amount: 24000,
        billingDay: 25,
        type: 'PERSONAL',
        assignedToMemberId: 'member-3', // Matías
        isActive: true,
        category: 'Educación',
      }),
    ];

    seedSubs.forEach((s) => this.subscriptions.set(s.id, s));
  }

  public async findAll(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  public async findById(id: string): Promise<Subscription | null> {
    return this.subscriptions.get(id) || null;
  }

  public async create(subscription: Subscription): Promise<Subscription> {
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  public async update(subscription: Subscription): Promise<Subscription> {
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  public async delete(id: string): Promise<boolean> {
    return this.subscriptions.delete(id);
  }
}
