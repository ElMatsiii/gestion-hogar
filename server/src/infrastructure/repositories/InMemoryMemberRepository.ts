import { Member } from '../../domain/entities/Member';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';

export class InMemoryMemberRepository implements IMemberRepository {
  private members: Map<string, Member> = new Map();

  constructor() {
    // Inicializa completamente vacío (sin datos predeterminados)
  }

  public async findAll(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  public async findById(id: string): Promise<Member | null> {
    return this.members.get(id) || null;
  }

  public async create(member: Member): Promise<Member> {
    this.members.set(member.id, member);
    return member;
  }

  public async update(member: Member): Promise<Member> {
    this.members.set(member.id, member);
    return member;
  }

  public async delete(id: string): Promise<boolean> {
    return this.members.delete(id);
  }
}
