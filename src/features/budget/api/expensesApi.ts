import { apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import type { Expense } from "../models/budget.models";
import {
  ADMIN_QUERY_PARAM,
  DEFAULT_CURRENCY,
} from "../constants/budget.constants";

export async function createExpense(
  eventId: number,
  expenseData: Partial<Expense> & { currency?: string; vendor_id?: string },
): Promise<{ expenseId: number }> {
  return apiPost<{ expenseId: number }>(`/api/expenses?${ADMIN_QUERY_PARAM}`, {
    eventId,
    vendorId: expenseData.vendor_id ? Number(expenseData.vendor_id) : null,
    categoryId: Number(expenseData.category_id),
    description: expenseData.description,
    amount: expenseData.amount,
    expenseDate: expenseData.expense_date,
    currency: expenseData.currency ?? DEFAULT_CURRENCY,
    notes: expenseData.notes,
    paymentStatus: expenseData.payment_status,
    methodOfPayment: expenseData.methodOfPayment,
    receiptUrl: expenseData.receipt_url ?? null,
  });
}

export async function updateExpense(
  _eventId: number,
  expenseId: string,
  updates: Partial<Expense> & { vendor_id?: string | null; event_id?: string },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.amount !== undefined) body.amount = updates.amount;
  if (updates.category_id !== undefined) body.categoryId = Number(updates.category_id);
  if (updates.expense_date !== undefined) body.expenseDate = updates.expense_date;
  if (updates.notes !== undefined) body.notes = updates.notes;
  if (updates.currency !== undefined) body.currency = updates.currency;
  if (updates.payment_status !== undefined) body.paymentStatus = updates.payment_status;
  if (updates.methodOfPayment !== undefined) body.methodOfPayment = updates.methodOfPayment;
  if (updates.receipt_url !== undefined) body.receiptUrl = updates.receipt_url ?? null;
  // Always send vendorId and eventId — backend needs them even when null
  body.vendorId = updates.vendor_id != null ? Number(updates.vendor_id) : null;
  body.eventId = updates.event_id != null ? Number(updates.event_id) : null;
  await apiPut(`/api/expenses/${expenseId}?${ADMIN_QUERY_PARAM}`, body);
}

export async function deleteExpense(
  _eventId: number,
  expenseId: string,
): Promise<void> {
  await apiDelete(`/api/expenses/${expenseId}`);
}
