"use client";
import type React from "react";
import type {
  BudgetAction,
  BudgetState,
  BudgetSummary,
  Category,
  CategoryPatchSource,
  Expense,
  TemplateCategoryRaw,
  VendorEvent,
} from "../models/budget.models";
import {
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
} from "../api/budgetApi";
import { updateEvent as apiUpdateEvent } from "@/features/events-list/api/eventsListApi";
import { STATUS_TO_API_STATUS } from "@/features/events-list/constants/events-list.constants";
import {
  assignVendorToEvent,
  unassignVendorFromEvent,
  updateVendorEvent as apiUpdateVendorEvent,
} from "../api/vendorEventsApi";
import {
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
} from "../api/expensesApi";
import { insertActivity } from "../api/activityLogApi";
import type { ActivityItem, ActivityType } from "../models/budget.models";
import { EventActions } from "@/shared/contexts/eventActions";
import type { EventAction } from "@/shared/contexts/eventActions";
import type { EventCardProps } from "@/features/events-list/models/eventCardProps.models";
import {
  generateBudgetId,
  computeSpentSummary,
  computeAllocatedTotal,
  mergeTemplateCategories,
} from "../utils/budget.utils";
import { CategoriesService } from "../api/categoriesApi";

interface UseBudgetActionsParams {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
  eventId: number;
  selectedEvent: EventCardProps | null | undefined;
  eventDispatch: React.Dispatch<EventAction>;
}

export interface UseBudgetActionsResult {
  addExpense: (payload: Omit<Expense, "expense_id">) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => void;
  updateBudget: (totalBudget: number) => void;
  assignVendor: (vendorId: string) => void;
  unassignVendor: (vendorId: string) => void;
  updateVendorEvent: (vendorId: string, data: Partial<VendorEvent>) => Promise<void>;
  loadTemplate: (template: CategoryPatchSource) => Promise<void>;
  loadEstimate: (estimate: CategoryPatchSource) => Promise<void>;
}

export const useBudgetActions = ({
  state,
  dispatch,
  eventId,
  selectedEvent,
  eventDispatch,
}: UseBudgetActionsParams): UseBudgetActionsResult => {
  const persist = (type: ActivityType, description: string, amount?: number) => {
    const activity: ActivityItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      description,
      amount,
      timestamp: new Date().toISOString(),
    };
    insertActivity(eventId, activity).catch(() => {});
  };

  const resolveVendorId = (vendorName?: string): string | undefined =>
    vendorName
      ? state.vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())?.vendor_id
      : undefined;

  const addExpense = (payload: Omit<Expense, "expense_id">) => {
    const tempId = generateBudgetId();
    dispatch({ type: "ADD_EXPENSE", payload: { ...payload, expense_id: tempId } });
    persist('expense_added', payload.description, payload.amount);
    const cat = state.categories.find((c) => c.id === payload.category_id);
    apiCreateExpense(eventId, {
      ...payload,
      ...(cat?.catalog_id ? { category_id: cat.catalog_id } : {}),
      vendor_id: resolveVendorId(payload.vendor_name),
    })
      .then(({ expenseId }) => {
        // Replace the temp ID with the real server-assigned ID so future PUTs work correctly.
        dispatch({ type: "UPDATE_EXPENSE", payload: { id: tempId, data: { expense_id: String(expenseId) } } });
      })
      .catch((err) => console.error("createExpense failed:", err));
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    dispatch({ type: "UPDATE_EXPENSE", payload: { id, data } });
    // Guard: temp IDs haven't been synced to the server yet.
    if (id.startsWith("id_")) return;
    const prev = state.expenses.find((e) => e.expense_id === id);
    if (prev) {
      const type: ActivityType = data.payment_status === 'paid' ? 'payment_made' : 'expense_edited';
      persist(type, data.description ?? prev.description, data.amount ?? prev.amount);
    }

    const apiData: Partial<Expense> & { vendor_id?: string } = { ...data };

    // Resolve category to catalog ID when category is being changed.
    if (data.category_id) {
      const cat = state.categories.find((c) => c.id === data.category_id);
      if (cat?.catalog_id) apiData.category_id = cat.catalog_id;
    }

    if (data.vendor_name !== undefined) apiData.vendor_id = resolveVendorId(data.vendor_name);

    apiUpdateExpense(eventId, id, apiData).catch((err) =>
      console.error("updateExpense failed:", err),
    );
  };

  const deleteExpense = (expenseId: string) => {
    const exp = state.expenses.find((e) => e.expense_id === expenseId);
    dispatch({ type: "DELETE_EXPENSE", payload: expenseId });
    if (exp) persist('expense_deleted', exp.description, exp.amount);
    apiDeleteExpense(eventId, expenseId).catch((err) =>
      console.error("deleteExpense failed:", err),
    );
  };

  const addCategory = (category: Category) => {
    dispatch({ type: "ADD_CATEGORY", payload: category });
    persist('category_updated', category.budget_name ?? category.name);
    apiCreateCategory(eventId, {
      catalogCategoryId: category.catalog_id!,
      budget_name: category.budget_name ?? "",
      budget_notes: category.budget_notes,
      allocated: category.allocated ?? 0,
    })
      .then(({ budgetId }) =>
        dispatch({ type: "UPDATE_CATEGORY", payload: { id: category.id, data: { id: String(budgetId) } } }),
      )
      .catch((err) => console.error("createCategory failed:", err));
  };

  const updateCategory = async (id: string, data: Partial<Category>): Promise<void> => {
    const current = state.categories.find((c) => c.id === id);
    if (!current) return;
    dispatch({ type: "UPDATE_CATEGORY", payload: { id, data } });
    persist('category_updated', data.budget_name ?? data.name ?? current.budget_name ?? current.name);
    await apiUpdateCategory(id, {
      eventId,
      categoryId: Number(current.catalog_id),
      description: data.budget_name ?? current.budget_name ?? current.name,
      allocatedAmount: data.allocated ?? current.allocated,
      spentAmount: current.spent,
      currency: state.currency,
      notes: data.budget_notes ?? current.budget_notes ?? "",
    });
  };

  const deleteCategory = (categoryId: string) => {
    const cat = state.categories.find((c) => c.id === categoryId);
    dispatch({ type: "DELETE_CATEGORY", payload: categoryId });
    if (cat) persist('category_updated', cat.budget_name ?? cat.name);
    apiDeleteCategory(categoryId).catch((err) =>
      console.error("deleteCategory failed:", err),
    );
  };

  const updateBudget = (totalBudget: number) => {
    const prev = state.summary?.total_budget ?? 0;
    dispatch({ type: "UPDATE_BUDGET", payload: totalBudget });
    persist('budget_updated', `Budget updated: $${prev.toLocaleString()} → $${totalBudget.toLocaleString()}`);
    if (selectedEvent) {
      eventDispatch({
        type: EventActions.UPDATE_EVENT,
        payload: { ...(selectedEvent as EventCardProps), budget: totalBudget },
      });
      apiUpdateEvent(eventId, {
        eventName:    selectedEvent.eventName,
        title:        selectedEvent.eventName,
        description:  selectedEvent.description ?? "",
        eventDate:    selectedEvent.rawDate ?? new Date().toISOString(),
        eventAddress: selectedEvent.location ?? "",
        budget:       totalBudget,
        status:       STATUS_TO_API_STATUS[selectedEvent.status],
      }).catch((err) => console.error("updateBudget failed:", err));
    }
  };

  const assignVendor = (vendorId: string) => {
    if (state.vendorEvents.some((ve) => ve.vendor_id === vendorId)) return;
    const newVe: VendorEvent = { vendor_id: vendorId, event_id: eventId, status: "active" };
    dispatch({ type: "ASSIGN_VENDOR_EVENT", payload: newVe });
    assignVendorToEvent(eventId, vendorId).catch((err) =>
      console.error("assignVendorToEvent failed:", err),
    );
  };

  const unassignVendor = (vendorId: string) => {
    dispatch({ type: "UNASSIGN_VENDOR_EVENT", payload: vendorId });
    unassignVendorFromEvent(eventId, vendorId).catch((err) =>
      console.error("unassignVendorFromEvent failed:", err),
    );
  };

  const updateVendorEvent = async (vendorId: string, data: Partial<VendorEvent>): Promise<void> => {
    dispatch({ type: "UPDATE_VENDOR_EVENT", payload: { vendor_id: vendorId, data } });
    await apiUpdateVendorEvent(eventId, vendorId, {
      contractedAmount: data.contracted_amount,
      contractedDate: data.contracted_date,
      status: data.status,
      notes: data.notes,
    });
  };

  const applyCategoryPatch = (
    source: CategoryPatchSource,
    getAllocated: (c: TemplateCategoryRaw, totalBudget: number) => number,
    getPercentage: (c: TemplateCategoryRaw, allocated: number, totalBudget: number) => number,
  ) => {
    const totalBudget = source.total_budget ?? state.summary?.total_budget ?? 0;
    if (source.total_budget) dispatch({ type: "UPDATE_BUDGET", payload: source.total_budget });
    if (!source.categories) return;

    const combined = mergeTemplateCategories(
      source.categories,
      state.categories,
      (c, match) => {
        const allocated = getAllocated(c, totalBudget);
        return {
          id: match?.id ?? generateBudgetId(),
          name: c.name,
          allocated,
          spent: match?.spent ?? (typeof c.spent === "number" ? c.spent : 0),
          expense_count: match?.expense_count ?? 0,
          remaining: allocated - (match?.spent ?? (c.spent ?? 0)),
          percentage: getPercentage(c, allocated, totalBudget),
          color: c.color ?? match?.color,
        } as Category;
      },
    );

    const total_allocated = computeAllocatedTotal(combined);
    const total_spent = state.summary?.total_spent ?? 0;
    dispatch({
      type: "SET_DATA",
      payload: {
        categories: combined,
        summary: {
          ...(state.summary as BudgetSummary),
          ...computeSpentSummary(totalBudget, total_spent),
          total_allocated,
          total_budget: totalBudget,
        },
      },
    });
  };

  const loadTemplate = async (template: CategoryPatchSource) => {
    const totalBudget = template.total_budget ?? state.summary?.total_budget ?? 0;

    // 1. Persist total budget
    if (template.total_budget) updateBudget(template.total_budget);

    if (!template.categories) return;

    // 2. Build merged categories (same logic as applyCategoryPatch)
    const combined = mergeTemplateCategories(
      template.categories,
      state.categories,
      (c, match) => {
        const allocated = Math.round(((c.percentage ?? 0) * totalBudget) / 100);
        return {
          id:            match?.id ?? generateBudgetId(),
          catalog_id:    match?.catalog_id,
          name:          c.name,
          budget_name:   match?.budget_name ?? c.name,
          budget_notes:  match?.budget_notes,
          allocated,
          spent:         match?.spent ?? 0,
          expense_count: match?.expense_count ?? 0,
          remaining:     allocated - (match?.spent ?? 0),
          percentage:    c.percentage ?? 0,
          color:         c.color ?? match?.color,
        } as Category;
      },
    );

    // 3. Optimistic UI update
    const total_allocated = computeAllocatedTotal(combined);
    const total_spent = state.summary?.total_spent ?? 0;
    dispatch({
      type: "SET_DATA",
      payload: {
        categories: combined,
        summary: {
          ...(state.summary as BudgetSummary),
          ...computeSpentSummary(totalBudget, total_spent),
          total_allocated,
          total_budget: totalBudget,
        },
      },
    });

    // 4. Persist each template category
    const templateNames = new Set(
      template.categories.map((c) => c.name.trim().toLowerCase()),
    );
    const templateCats = combined.filter((c) =>
      templateNames.has(c.name.trim().toLowerCase()),
    );

    const hasNew = templateCats.some((c) => c.id.startsWith("id_"));
    let catalogList: { category_id: string; name: string }[] = [];
    if (hasNew) {
      try {
        catalogList = await CategoriesService.getAll();
      } catch (err) {
        console.error("loadTemplate: failed to fetch catalog", err);
      }
    }

    for (const cat of templateCats) {
      if (!cat.id.startsWith("id_")) {
        // Existing category — update allocatedAmount
        apiUpdateCategory(cat.id, {
          eventId,
          categoryId:      Number(cat.catalog_id),
          description:     cat.budget_name ?? cat.name,
          allocatedAmount: cat.allocated,
          spentAmount:     cat.spent,
          currency:        state.currency,
          notes:           cat.budget_notes ?? "",
        }).catch((err) => console.error("loadTemplate: updateCategory failed", err));
      } else {
        // New category — find or create catalog entry, then create budget line
        (async () => {
          try {
            let catalogMatch = catalogList.find(
              (cc) => (cc.name ?? "").trim().toLowerCase() === cat.name.trim().toLowerCase(),
            );
            if (!catalogMatch) {
              catalogMatch = await CategoriesService.create(cat.name, "");
              catalogList.push(catalogMatch);
            }
            const { budgetId } = await apiCreateCategory(eventId, {
              catalogCategoryId: catalogMatch.category_id,
              budget_name:       cat.name,
              budget_notes:      cat.budget_notes,
              allocated:         cat.allocated,
            });
            dispatch({
              type: "UPDATE_CATEGORY",
              payload: { id: cat.id, data: { id: String(budgetId), catalog_id: catalogMatch.category_id } },
            });
          } catch (err) {
            console.error("loadTemplate: createCategory failed", err);
          }
        })();
      }
    }
  };

  const loadEstimate = async (estimate: CategoryPatchSource) => {
    const totalBudget = estimate.total_budget ?? state.summary?.total_budget ?? 0;

    // 1. Persist budget total (API + EventContext)
    if (estimate.total_budget) updateBudget(estimate.total_budget);

    if (!estimate.categories) return;

    // 2. Build merged categories
    const combined = mergeTemplateCategories(
      estimate.categories,
      state.categories,
      (c, match) => {
        const allocated = typeof c.allocated === "number"
          ? Math.round(c.allocated)
          : Math.round(((c.percentage ?? 0) * totalBudget) / 100);
        const percentage = typeof c.percentage === "number"
          ? Number.parseFloat(c.percentage.toFixed(2))
          : totalBudget > 0
          ? Number.parseFloat(((allocated / totalBudget) * 100).toFixed(2))
          : 0;
        return {
          id:            match?.id ?? generateBudgetId(),
          catalog_id:    match?.catalog_id,
          name:          c.name,
          budget_name:   match?.budget_name ?? c.name,
          budget_notes:  match?.budget_notes,
          allocated,
          spent:         match?.spent ?? 0,
          expense_count: match?.expense_count ?? 0,
          remaining:     allocated - (match?.spent ?? 0),
          percentage,
          color:         c.color ?? match?.color,
        } as Category;
      },
    );

    // 3. Optimistic UI update
    const total_allocated = computeAllocatedTotal(combined);
    const total_spent = state.summary?.total_spent ?? 0;
    dispatch({
      type: "SET_DATA",
      payload: {
        categories: combined,
        summary: {
          ...(state.summary as BudgetSummary),
          ...computeSpentSummary(totalBudget, total_spent),
          total_allocated,
          total_budget: totalBudget,
        },
      },
    });

    // 4. Persist each estimate category to API
    const estimateNames = new Set(estimate.categories.map((c) => c.name.trim().toLowerCase()));
    const estimateCats = combined.filter((c) => estimateNames.has(c.name.trim().toLowerCase()));

    const hasNew = estimateCats.some((c) => c.id.startsWith("id_"));
    let catalogList: { category_id: string; name: string }[] = [];
    if (hasNew) {
      try {
        catalogList = await CategoriesService.getAll();
      } catch (err) {
        console.error("loadEstimate: failed to fetch catalog", err);
      }
    }

    for (const cat of estimateCats) {
      if (!cat.id.startsWith("id_")) {
        apiUpdateCategory(cat.id, {
          eventId,
          categoryId:      Number(cat.catalog_id),
          description:     cat.budget_name ?? cat.name,
          allocatedAmount: cat.allocated,
          spentAmount:     cat.spent,
          currency:        state.currency,
          notes:           cat.budget_notes ?? "",
        }).catch((err) => console.error("loadEstimate: updateCategory failed", err));
      } else {
        (async () => {
          try {
            let catalogMatch = catalogList.find(
              (cc) => (cc.name ?? "").trim().toLowerCase() === cat.name.trim().toLowerCase(),
            );
            if (!catalogMatch) {
              catalogMatch = await CategoriesService.create(cat.name, "");
              catalogList.push(catalogMatch);
            }
            const { budgetId } = await apiCreateCategory(eventId, {
              catalogCategoryId: catalogMatch.category_id,
              budget_name:       cat.name,
              budget_notes:      cat.budget_notes,
              allocated:         cat.allocated,
            });
            dispatch({
              type: "UPDATE_CATEGORY",
              payload: { id: cat.id, data: { id: String(budgetId), catalog_id: catalogMatch.category_id } },
            });
          } catch (err) {
            console.error("loadEstimate: createCategory failed", err);
          }
        })();
      }
    }
  };

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    updateBudget,
    assignVendor,
    unassignVendor,
    updateVendorEvent,
    loadTemplate,
    loadEstimate,
  };
};
