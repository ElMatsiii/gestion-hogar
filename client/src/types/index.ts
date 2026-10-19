export type ExpenseCategory =
  | 'VIVIENDA'
  | 'ALIMENTACION'
  | 'SERVICIOS'
  | 'TRANSPORTE'
  | 'SALUD'
  | 'EDUCACION'
  | 'OCIO'
  | 'SUSCRIPCIONES'
  | 'PERSONAL'
  | 'OTRO';

export type ExpenseType = 'SHARED' | 'PERSONAL';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  monthlyIncome: number;
  role: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  paidById: string;
  assignedToMemberId?: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface Subscription {
  id: string;
  title: string;
  amount: number;
  billingDay: number;
  type: 'SHARED' | 'PERSONAL';
  assignedToMemberId?: string;
  isActive: boolean;
  category: string;
  createdAt?: string;
}

export type InventoryCategory =
  | 'Lácteos'
  | 'Carnes y Pescados'
  | 'Despensa y Granos'
  | 'Frutas y Verduras'
  | 'Bebidas'
  | 'Congelados'
  | 'Limpieza y Aseo'
  | 'Otros';

export type InventoryLocation = 'Despensa' | 'Refrigerador' | 'Congelador' | 'Lavandería';

export type ExpirationStatus = 'EXPIRED' | 'EXPIRING_SOON' | 'FRESH' | 'NO_EXPIRATION';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  expirationDate?: string;
  location: InventoryLocation;
  notes?: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  daysUntilExpiration: number | null;
  expirationStatus: ExpirationStatus;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  inventoryItemId?: string;
  category?: string;
  createdAt?: string;
}

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
  disbursedAmount: number;
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
