import { IMemberRepository } from '../../domain/repositories/IMemberRepository';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';

export interface MemberFinancialDetail {
  memberId: string;
  name: string;
  avatarColor: string;
  role: string;
  monthlyIncome: number;
  percentageOfFamilyIncome: number;
  personalExpensesTotal: number;
  personalSubscriptionsTotal: number;
  totalPersonalObligations: number;
  disbursedAmount: number; // How much physical money this person actually paid out
}

export interface FinancialSummaryDTO {
  totalFamilyIncome: number;
  totalSharedExpenses: number;
  totalPersonalExpenses: number;
  totalExpenses: number;
  totalSubscriptions: number;
  remainingFamilyPool: number;
  savingsRatePercentage: number;
  membersCount: number;
  memberBreakdown: MemberFinancialDetail[];
  categoryBreakdown: { category: string; total: number; percentage: number }[];
}

export class GetFinancialSummaryUseCase {
  constructor(
    private readonly memberRepo: IMemberRepository,
    private readonly expenseRepo: IExpenseRepository,
    private readonly subscriptionRepo: ISubscriptionRepository
  ) {}

  public async execute(month?: string): Promise<FinancialSummaryDTO> {
    const members = await this.memberRepo.findAll();
    const allExpenses = await this.expenseRepo.findAll();
    const subscriptions = await this.subscriptionRepo.findAll();

    // Filter expenses by month if provided (YYYY-MM)
    const expenses = month
      ? allExpenses.filter((e) => e.date.startsWith(month))
      : allExpenses;

    const totalFamilyIncome = members.reduce((sum, m) => sum + m.monthlyIncome, 0);

    const activeSubscriptions = subscriptions.filter((s) => s.isActive);
    const totalSubscriptions = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

    let totalSharedExpenses = 0;
    let totalPersonalExpenses = 0;

    const categoryMap = new Map<string, number>();

    expenses.forEach((expense) => {
      if (expense.isShared()) {
        totalSharedExpenses += expense.amount;
      } else {
        totalPersonalExpenses += expense.amount;
      }

      const currentCat = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, currentCat + expense.amount);
    });

    const totalExpenses = totalSharedExpenses + totalPersonalExpenses;
    const remainingFamilyPool = totalFamilyIncome - totalExpenses;
    const savingsRatePercentage =
      totalFamilyIncome > 0
        ? Math.max(0, Math.round(((totalFamilyIncome - totalExpenses) / totalFamilyIncome) * 100))
        : 0;

    const memberBreakdown: MemberFinancialDetail[] = members.map((member) => {
      const percentageOfFamilyIncome =
        totalFamilyIncome > 0 ? (member.monthlyIncome / totalFamilyIncome) * 100 : 0;

      const memberPersonalExpenses = expenses
        .filter((e) => e.assignedToMemberId === member.id && e.isPersonal())
        .reduce((sum, e) => sum + e.amount, 0);

      const memberPersonalSubs = activeSubscriptions
        .filter((s) => s.assignedToMemberId === member.id && s.type === 'PERSONAL')
        .reduce((sum, s) => sum + s.amount, 0);

      const disbursedAmount = expenses
        .filter((e) => e.paidById === member.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        memberId: member.id,
        name: member.name,
        avatarColor: member.avatarColor,
        role: member.role,
        monthlyIncome: member.monthlyIncome,
        percentageOfFamilyIncome: Number(percentageOfFamilyIncome.toFixed(1)),
        personalExpensesTotal: memberPersonalExpenses,
        personalSubscriptionsTotal: memberPersonalSubs,
        totalPersonalObligations: memberPersonalExpenses + memberPersonalSubs,
        disbursedAmount,
      };
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalExpenses > 0 ? Number(((total / totalExpenses) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalFamilyIncome,
      totalSharedExpenses,
      totalPersonalExpenses,
      totalExpenses,
      totalSubscriptions,
      remainingFamilyPool,
      savingsRatePercentage,
      membersCount: members.length,
      memberBreakdown,
      categoryBreakdown,
    };
  }
}
