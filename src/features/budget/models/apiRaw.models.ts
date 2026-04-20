// Raw response shapes from the .NET backend API.
// These mirror the actual HTTP response structure before frontend mapping.

export interface ApiCategory {
  categoryId: number;
  name: string;
  description?: string | null;
}

export interface ApiBudget {
  budgetId: number;
  eventId: number;
  categoryId: number;
  description: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  notes?: string | null;
}

export interface ApiExpense {
  expenseId: number;
  eventId: number;
  vendorId?: number | null;
  categoryId: number;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  currency: string;
  receiptUrl?: string | null;
  paymentStatus?: string | null;
  methodOfPayment?: string | null;
}

export interface ApiVendor {
  vendorId: number;
  vendorName: string;
  category: string;
  contactPerson?: string;
  email?: string;
  mobilePhone?: string;
  phone?: string;
  address?: string;
  notes?: string;
  rating: number;
  isActive: boolean;
}

export interface ApiBudgetItem {
  budgetItemId: number;
  budgetId: number;
  categoryId?: number | null;
  description: string;
  amount: number;
  notes?: string | null;
}
