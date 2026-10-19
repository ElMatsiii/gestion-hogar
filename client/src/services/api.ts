import {
  FinancialSummaryDTO,
  Member,
  Expense,
  Subscription,
  InventoryItem,
  ShoppingItem,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Finances
  getFinancialSummary: (month?: string) =>
    request<FinancialSummaryDTO>(`/finances/summary${month ? `?month=${month}` : ''}`),

  getMembers: () => request<Member[]>('/finances/members'),

  createMember: (data: { name: string; avatarColor?: string; monthlyIncome: number; role?: string }) =>
    request<Member>('/finances/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMemberIncome: (id: string, monthlyIncome: number) =>
    request<Member>(`/finances/members/${id}/income`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyIncome }),
    }),

  getExpenses: (filter?: { type?: string; memberId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.memberId) params.append('memberId', filter.memberId);
    return request<Expense[]>(`/finances/expenses?${params.toString()}`);
  },

  createExpense: (data: Omit<Expense, 'id' | 'createdAt'>) =>
    request<Expense>('/finances/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/finances/expenses/${id}`, {
      method: 'DELETE',
    }),

  getSubscriptions: () => request<Subscription[]>('/finances/subscriptions'),

  createSubscription: (data: Omit<Subscription, 'id' | 'createdAt'>) =>
    request<Subscription>('/finances/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleSubscription: (id: string) =>
    request<Subscription>(`/finances/subscriptions/${id}/toggle`, {
      method: 'PATCH',
    }),

  deleteSubscription: (id: string) =>
    request<{ success: boolean }>(`/finances/subscriptions/${id}`, {
      method: 'DELETE',
    }),

  // Inventory & Pantry
  getInventoryItems: (params?: { category?: string; location?: string; lowStock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.location) query.append('location', params.location);
    if (params?.lowStock) query.append('lowStock', 'true');
    return request<InventoryItem[]>(`/inventory/items?${query.toString()}`);
  },

  createInventoryItem: (data: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    minThreshold: number;
    expirationDate?: string;
    location: string;
    notes?: string;
  }) =>
    request<InventoryItem>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adjustStock: (id: string, delta: number) =>
    request<InventoryItem>(`/inventory/items/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    }),

  deleteInventoryItem: (id: string) =>
    request<{ success: boolean }>(`/inventory/items/${id}`, {
      method: 'DELETE',
    }),

  // Shopping List
  getShoppingList: () => request<ShoppingItem[]>('/inventory/shopping'),

  createShoppingItem: (data: {
    name: string;
    quantity: number;
    unit?: string;
    category?: string;
    inventoryItemId?: string;
  }) =>
    request<ShoppingItem>('/inventory/shopping', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleShoppingItem: (id: string, autoRestock = true) =>
    request<ShoppingItem>(`/inventory/shopping/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ autoRestock }),
    }),

  deleteShoppingItem: (id: string) =>
    request<{ success: boolean }>(`/inventory/shopping/${id}`, {
      method: 'DELETE',
    }),

  clearPurchasedShopping: () =>
    request<{ message: string }>('/inventory/shopping/actions/clear-purchased', {
      method: 'DELETE',
    }),
};
