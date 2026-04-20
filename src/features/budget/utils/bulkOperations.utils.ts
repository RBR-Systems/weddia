import type { Category, Expense } from '../models/budget.models';
import { CSV_HEADERS, CSV_MIME_TYPE } from '../constants/planner.constants';

export const buildExpenseCsvRows = (expenses: Expense[], categories: Category[]): string => {
  const rows = expenses.map((e) => {
    const cat = categories.find((c) => c.id === e.category_id);
    return [
      `"${e.description}"`,
      e.amount,
      `"${cat?.name ?? ''}"`,
      `"${e.vendor_name ?? ''}"`,
      e.expense_date,
      e.payment_status,
    ].join(',');
  });
  return [CSV_HEADERS.join(','), ...rows].join('\n');
};

export const triggerCsvDownload = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: CSV_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
