import { Member } from '../../domain/entities/Member';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';

export class InMemoryMemberRepository implements IMemberRepository {
  private members: Map<string, Member> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const seedMembers = [
      new Member({
        id: 'member-1',
        name: 'Carlos (Papá)',
        avatarColor: '#3B82F6', // Blue
        monthlyIncome: 1400000,
        role: 'Padre',
      }),
      new Member({
        id: 'member-2',
        name: 'Marcela (Mamá)',
        avatarColor: '#EC4899', // Pink
        monthlyIncome: 1250000,
        role: 'Madre',
      }),
      new Member({
        id: 'member-3',
        name: 'Matías (Hijo)',
        avatarColor: '#10B981', // Emerald
        monthlyIncome: 450000,
        role: 'Hijo',
      }),
    ];

    seedMembers.forEach((m) => this.members.set(m.id, m));
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
