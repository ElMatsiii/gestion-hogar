import { Subscription } from '../../domain/entities/Subscription';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    // Inicializa completamente vacío (sin datos predeterminados)
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
