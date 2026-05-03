"use client";
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { BudgetContextValue, BudgetAction } from "../models/budget.models";
import { BUDGET_INITIAL_STATE } from "../constants/budget.constants";
import { getBudgetData } from "../api/budgetApi";
import { ApiError, isAbortError } from "@/shared/api/apiClient";
import { useEvent } from "@/shared/contexts/EventContext";
import { mapApiDataToBudgetState } from "../utils/budget.utils";
import { budgetReducer } from "../utils/budgetReducer.utils";
import { useBudgetActions } from "../hooks/useBudgetActions";

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(budgetReducer, BUDGET_INITIAL_STATE);
  const { state: { events: { selectedEvent } }, dispatch: eventDispatch } = useEvent();
  const eventId = selectedEvent?.id ?? 1;
  const eventBudget = selectedEvent?.budget;

  const loadBudgetData = useCallback(async (eid: number, signal?: AbortSignal) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await getBudgetData(eid, signal);
      dispatch({ type: "SET_DATA", payload: mapApiDataToBudgetState(data, eventBudget) });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      if (err instanceof ApiError && err.status === 401) return;
      console.error("Failed to load budget data:", err);
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "Failed to load budget data" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [eventBudget]);

  useEffect(() => {
    if (!selectedEvent) return;
    const controller = new AbortController();
    loadBudgetData(eventId, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, loadBudgetData]);

  const refreshData = () => loadBudgetData(eventId);

  const actions = useBudgetActions({ state, dispatch: dispatch as React.Dispatch<BudgetAction>, eventId, selectedEvent, eventDispatch });

  const value: BudgetContextValue = {
    state,
    loadBudgetData,
    refreshData,
    ...actions,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}

