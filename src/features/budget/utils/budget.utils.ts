import { getRandomId } from '@/shared/utils/rng';
import dayjs from 'dayjs';
import { formatCurrency } from '@/shared/utils/formatters.utils';
import type { ActivityItem, BudgetNotification, BudgetSummary, Category, Currency, Expense } from '../models/budget.models';
import { OVER_BUDGET_THRESHOLD_PERCENT, BUDGET_WARNING_THRESHOLD_PERCENT, CATEGORY_WARNING_THRESHOLD } from '../constants/budget.constants';
import type { BudgetDataAPI } from '../models/api.models';

export const generateBudgetId = (): string => getRandomId('id_');

export const computeSpentSummary = (
  totalBudget: number,
  totalSpent: number,
): Pick<BudgetSummary, 'percentage_spent' | 'total_remaining'> => ({
  percentage_spent:
    totalBudget > 0
      ? Number.parseFloat(((totalSpent / totalBudget) * 100).toFixed(2))
      : 0,
  total_remaining: totalBudget - totalSpent,
});

export const computeAllocatedTotal = (categories: Category[]): number =>
  categories.reduce((sum, c) => sum + (c.allocated ?? 0), 0);

export interface TemplateCategoryRaw {
  name: string;
  percentage?: number;
  allocated?: number;
  spent?: number;
  color?: string;
}

export const mergeTemplateCategories = (
  templateCats: TemplateCategoryRaw[],
  existingCats: Category[],
  buildCategory: (raw: TemplateCategoryRaw, match: Category | undefined) => Category,
): Category[] => {
  const existingByName = new Map(
    existingCats.map((c) => [c.name.trim().toLowerCase(), c]),
  );
  const templateNames = new Set(
    templateCats.map((c) => (c.name || '').trim().toLowerCase()),
  );
  const mapped = templateCats.map((c) =>
    buildCategory(c, existingByName.get((c.name || '').trim().toLowerCase())),
  );
  const others = existingCats.filter(
    (c) => !templateNames.has(c.name.trim().toLowerCase()),
  );
  return [...mapped, ...others];
};

export const mapApiDataToBudgetState = (
  data: BudgetDataAPI,
  eventBudget?: number,
) => {
  const totalBudget = eventBudget ?? data.summary.total_budget;
  const totalSpent = data.summary.total_spent;

  return {
    summary: {
      total_budget: totalBudget,
      total_allocated: data.summary.total_allocated ?? 0,
      total_spent: totalSpent,
      ...computeSpentSummary(totalBudget, totalSpent),
      status: data.summary.status,
      currency: data.budget.currency as Currency,
    },
    categories: data.categories.map((c) => ({
      id: c.category_id,
      catalog_id: c.catalog_category_id,
      name: c.name,
      description: c.description ?? '',
      budget_name: c.budget_name ?? '',
      budget_notes: c.budget_notes ?? '',
      allocated: c.allocated,
      spent: c.spent,
      remaining: c.remaining,
      percentage: c.percentage,
      expense_count: c.expense_count,
      color: c.color,
    })),
    expenses: data.expenses.map((e) => ({
      expense_id: e.expense_id,
      description: e.description,
      amount: e.amount,
      category_id: e.category_id,
      vendor_name: e.vendor_name,
      expense_date: e.expense_date,
      payment_status: e.payment_status,
      methodOfPayment: e.methodOfPayment ?? '',
      receipt_url: e.receipt_url ?? null,
      receipt_urls: e.receipt_url ? [e.receipt_url] : [],
    })),
    vendors: data.vendors.map((v) => ({
      vendor_id: v.vendor_id,
      name: v.name,
      category: v.category ?? '',
      contact_name: v.contact_person ?? '',
      email: v.email ?? '',
      phone: v.phone ?? '',
      address: v.address ?? '',
      notes: v.notes ?? '',
      rating: v.rating ?? 0,
      is_active: v.is_active ?? true,
      total_spent: v.total_spent ?? 0,
      expense_count: v.expense_count ?? 0,
    })),
    currency: data.budget.currency as Currency,
  };
};

// ── Activity Log ─────────────────────────────────────────────────────────────

export const generateMockActivities = (): ActivityItem[] => [
  {
    id: '1',
    type: 'expense_added',
    description: 'Added expense: Venue Deposit',
    amount: 5000,
    user: 'John Doe',
    timestamp: dayjs().subtract(1, 'hour').toISOString(),
  },
  {
    id: '2',
    type: 'payment_made',
    description: 'Marked payment as paid: Photography Package',
    amount: 3500,
    user: 'Jane Smith',
    timestamp: dayjs().subtract(3, 'hours').toISOString(),
  },
  {
    id: '3',
    type: 'category_updated',
    description: 'Updated allocation for Catering & Bar',
    user: 'John Doe',
    timestamp: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: '4',
    type: 'expense_edited',
    description: 'Modified expense: DJ Services',
    amount: 1200,
    user: 'Jane Smith',
    timestamp: dayjs().subtract(2, 'days').toISOString(),
  },
  {
    id: '5',
    type: 'budget_updated',
    description: 'Total budget increased from $45,000 to $50,000',
    user: 'John Doe',
    timestamp: dayjs().subtract(3, 'days').toISOString(),
  },
  {
    id: '6',
    type: 'expense_deleted',
    description: 'Removed expense: Initial Florist Quote',
    amount: 2000,
    user: 'Jane Smith',
    timestamp: dayjs().subtract(5, 'days').toISOString(),
  },
];

// ── Notifications ─────────────────────────────────────────────────────────────

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const generateBudgetNotifications = (
  categories: Category[],
  expenses: Expense[],
  summary: BudgetSummary | null,
  currency: Currency,
  t: TranslateFn,
): BudgetNotification[] => {
  const notifs: BudgetNotification[] = [];

  categories.forEach((cat) => {
    if (cat.spent > cat.allocated && cat.allocated > 0) {
      notifs.push({
        id: `over_${cat.id}`,
        type: 'alert',
        title: t('notifications.categoryOverBudget'),
        message: t('notifications.categoryOverMsg', {
          name: cat.name,
          amount: formatCurrency(cat.spent - cat.allocated, currency),
        }),
        timestamp: dayjs().toISOString(),
        read: false,
      });
    } else if (cat.allocated > 0 && cat.spent / cat.allocated > CATEGORY_WARNING_THRESHOLD) {
      notifs.push({
        id: `warn_${cat.id}`,
        type: 'warning',
        title: t('notifications.categoryApproaching'),
        message: t('notifications.categoryApproachingMsg', {
          name: cat.name,
          percent: Math.round((cat.spent / cat.allocated) * 100),
        }),
        timestamp: dayjs().toISOString(),
        read: false,
      });
    }
  });

  const pendingExpenses = expenses.filter((e) => e.payment_status === 'pending');
  if (pendingExpenses.length > 0) {
    notifs.push({
      id: 'pending_payments',
      type: 'reminder',
      title: t('notifications.pendingPayments'),
      message: t('notifications.pendingPaymentsMsg', {
        count: pendingExpenses.length,
        amount: formatCurrency(
          pendingExpenses.reduce((sum, e) => sum + e.amount, 0),
          currency,
        ),
      }),
      timestamp: dayjs().toISOString(),
      read: false,
    });
  }

  const percentSpent = summary?.percentage_spent ?? 0;
  if (percentSpent > OVER_BUDGET_THRESHOLD_PERCENT) {
    notifs.push({
      id: 'budget_critical',
      type: 'alert',
      title: t('notifications.budgetCritical'),
      message: t('notifications.budgetCriticalMsg', {
        percent: percentSpent,
        remaining: formatCurrency(summary?.total_remaining ?? 0, currency),
      }),
      timestamp: dayjs().toISOString(),
      read: false,
    });
  } else if (percentSpent > BUDGET_WARNING_THRESHOLD_PERCENT) {
    notifs.push({
      id: 'budget_warning',
      type: 'warning',
      title: t('notifications.budgetAlert'),
      message: t('notifications.budgetAlertMsg', { percent: percentSpent }),
      timestamp: dayjs().toISOString(),
      read: false,
    });
  }

  notifs.push({
    id: 'welcome',
    type: 'info',
    title: t('notifications.budgetTrackingActive'),
    message: t('notifications.budgetTrackingMsg'),
    timestamp: dayjs().subtract(1, 'day').toISOString(),
    read: true,
  });

  return notifs;
};

