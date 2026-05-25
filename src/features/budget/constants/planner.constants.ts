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
