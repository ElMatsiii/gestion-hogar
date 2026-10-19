import { Subscription } from '../entities/Subscription';

export interface ISubscriptionRepository {
  findAll(): Promise<Subscription[]>;
  findById(id: string): Promise<Subscription | null>;
  create(subscription: Subscription): Promise<Subscription>;
  update(subscription: Subscription): Promise<Subscription>;
  delete(id: string): Promise<boolean>;
}
