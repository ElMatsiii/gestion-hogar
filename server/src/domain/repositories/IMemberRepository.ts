import { Member } from '../entities/Member';

export interface IMemberRepository {
  findAll(): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  create(member: Member): Promise<Member>;
  update(member: Member): Promise<Member>;
  delete(id: string): Promise<boolean>;
}
