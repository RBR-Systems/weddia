import dayjs from 'dayjs';
import type { ClientBudget } from '../models/budget.models';

// ── Bulk Operations ───────────────────────────────────────────────────────────

export const CSV_HEADERS = ['Description', 'Amount', 'Category', 'Vendor', 'Date', 'Status'] as const;

export const EXPORT_ALL_FILENAME = 'budget-expenses-export.csv';
export const EXPORT_SELECTED_FILENAME = 'budget-expenses-selected.csv';
export const IMPORT_TEMPLATE_FILENAME = 'budget-import-template.csv';
export const CSV_MIME_TYPE = 'text/csv';

export const IMPORT_TEMPLATE_CONTENT =
  'Description,Amount,Category,Vendor,Date,Status\nExample Expense,1000,venue,Vendor Name,2026-03-15,pending';

export const IMPORT_PROGRESS_INTERVAL_MS = 200;
export const IMPORT_PROGRESS_TOTAL_MS = 2500;
export const IMPORT_PROGRESS_STEP = 10;
export const IMPORT_PROGRESS_MAX = 100;

export const BULK_TABLE_PAGE_SIZE = 10;

export const BULK_PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', labelKey: 'statusBadge.paid' },
  { value: 'pending', labelKey: 'statusBadge.pending' },
  { value: 'overdue', labelKey: 'statusBadge.overdue' },
  { value: 'partial', labelKey: 'statusBadge.partial' },
] as const;

// ── Multi-Client View ─────────────────────────────────────────────────────────

export const CLIENT_STATUS_CONFIG = {
  on_track: { labelKey: 'multiClientView.status.onTrack', color: 'success' },
  at_risk: { labelKey: 'multiClientView.status.atRisk', color: 'warning' },
  over_budget: { labelKey: 'multiClientView.status.overBudget', color: 'error' },
  completed: { labelKey: 'multiClientView.status.completed', color: 'default' },
} as const;

export const CLIENT_SEARCH_WIDTH = 200;
export const CLIENT_FILTER_WIDTH = 150;
export const CLIENT_TABLE_PAGE_SIZE = 10;
export const CLIENT_DATE_FORMAT = 'MMM D, YYYY';
export const CLIENT_AVATAR_SECONDARY_FONT_SIZE = 12;

export const AT_RISK_DAY_THRESHOLD = 30;
export const APPROACHING_DAY_THRESHOLD = 90;

export const MOCK_CLIENTS: ClientBudget[] = [
  {
    id: '1',
    clientName: 'Sarah & Michael',
    weddingDate: '2026-06-15',
    totalBudget: 50000,
    totalSpent: 35000,
    status: 'on_track',
    lastUpdated: dayjs().subtract(1, 'day').toISOString(),
    expenseCount: 24,
  },
  {
    id: '2',
    clientName: 'Emily & James',
    weddingDate: '2026-08-20',
    totalBudget: 75000,
    totalSpent: 68000,
    status: 'at_risk',
    lastUpdated: dayjs().subtract(2, 'hours').toISOString(),
    expenseCount: 45,
  },
  {
    id: '3',
    clientName: 'Jessica & David',
    weddingDate: '2026-04-10',
    totalBudget: 30000,
    totalSpent: 32500,
    status: 'over_budget',
    lastUpdated: dayjs().subtract(3, 'days').toISOString(),
    expenseCount: 18,
  },
  {
    id: '4',
    clientName: 'Amanda & Chris',
    weddingDate: '2025-12-31',
    totalBudget: 45000,
    totalSpent: 44800,
    status: 'completed',
    lastUpdated: dayjs().subtract(10, 'days').toISOString(),
    expenseCount: 38,
  },
  {
    id: '5',
    clientName: 'Rachel & Tom',
    weddingDate: '2026-09-05',
    totalBudget: 60000,
    totalSpent: 15000,
    status: 'on_track',
    lastUpdated: dayjs().toISOString(),
    expenseCount: 8,
  },
];
