---
applyTo: "src/**/*.tsx,src/**/*.ts"
---

# React Architecture Instructions — Vertical Slices

## The Core Rule

Every new file must be placed in the correct layer of its feature slice. Ask before placing any file:

1. Is it used only in this feature? → `features/featureName/`
2. Is it used in 2+ features? → `shared/`
3. Does it talk to HTTP? → `api/budgetApi.ts`
4. Does it hold static named values? → `constants/budget.constants.ts`
5. Is it a pure function with no React? → `utils/budget.utils.ts`
6. Does it manage state or side effects? → `hooks/useBudgetItems.ts`
7. Does it render UI? → `components/BudgetItemRow.tsx`
8. Does it define a type or interface? → `models/budget.models.ts`

## Models (`models/`)

All TypeScript types and interfaces live here. Never define types inline in component files.

```ts
// budget.models.ts
export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  estimatedAmount: number;
  actualAmount: number | null;
  vendorId: string | null;
  isPaid: boolean;
}

export type BudgetCategory = 'venue' | 'catering' | 'flowers' | 'photography' | 'other';

export interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  remaining: number;
  percentUsed: number;
}
```

## Constants (`constants/`)

All named values live here. No magic numbers or strings in any other file.

```ts
// budget.constants.ts
export const MAX_BUDGET_ITEMS = 200;
export const DEFAULT_CURRENCY = 'USD' as const;
export const BUDGET_CATEGORIES = ['venue', 'catering', 'flowers', 'photography', 'other'] as const;
export const OVER_BUDGET_THRESHOLD_PERCENT = 90;
```

## Utils (`utils/`)

Pure functions only — no React, no hooks, no API calls. Input in, output out.

```ts
// budget.utils.ts
export const formatCurrency = (amount: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const calculateBudgetSummary = (items: BudgetItem[]): BudgetSummary => {
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedAmount, 0);
  const totalActual = items.reduce((sum, i) => sum + (i.actualAmount ?? 0), 0);
  return {
    totalEstimated,
    totalActual,
    remaining: totalEstimated - totalActual,
    percentUsed: totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0,
  };
};
```

## API Layer (`api/`)

The ONLY place HTTP calls are made. No exceptions.

```ts
// budgetApi.ts
import { apiClient } from '@/shared/api/apiClient';
import type { BudgetItem } from '../models/budget.models';

export const getBudgetItems = (): Promise<BudgetItem[]> =>
  apiClient.get('/budget/items');

export const createBudgetItem = (payload: Omit<BudgetItem, 'id'>): Promise<BudgetItem> =>
  apiClient.post('/budget/items', payload);

export const updateBudgetItem = (id: string, payload: Partial<BudgetItem>): Promise<BudgetItem> =>
  apiClient.patch(`/budget/items/${id}`, payload);

export const deleteBudgetItem = (id: string): Promise<void> =>
  apiClient.delete(`/budget/items/${id}`);
```

## Hooks (`hooks/`)

Stateful logic and side effects. Calls `api/` functions. Returns stable typed interfaces.

```ts
// useBudgetItems.ts
import { useState, useEffect } from 'react';
import { getBudgetItems } from '../api/budgetApi';
import type { BudgetItem } from '../models/budget.models';

interface UseBudgetItemsResult {
  items: BudgetItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useBudgetItems = (): UseBudgetItemsResult => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = () => {
    setIsLoading(true);
    setError(null);
    getBudgetItems()
      .then(setItems)
      .catch(err => setError(err instanceof Error ? err : new Error('Unknown error')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return { items, isLoading, error, refetch: fetch };
};
```

## Components (`components/`)

Presentational only. Receives data via props, emits events via callbacks. No API calls, no direct state management beyond local UI state.

```tsx
// BudgetItemRow.tsx
import type { BudgetItem } from '../models/budget.models';
import { formatCurrency } from '../utils/budget.utils';

interface BudgetItemRowProps {
  item: BudgetItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const BudgetItemRow = ({ item, onEdit, onDelete }: BudgetItemRowProps) => (
  <tr>
    <td>{item.category}</td>
    <td>{formatCurrency(item.estimatedAmount)}</td>
    <td>{item.actualAmount != null ? formatCurrency(item.actualAmount) : '—'}</td>
    <td>
      <button onClick={() => onEdit(item.id)}>Edit</button>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </td>
  </tr>
);
```

## Feature Page (`FeaturePage.tsx`)

The route entry point. Composes hooks and components. Should remain thin.

```tsx
// BudgetPage.tsx
import { useBudgetItems } from './hooks/useBudgetItems';
import { BudgetList } from './components/BudgetList';
import { BudgetSummaryCard } from './components/BudgetSummaryCard';

export const BudgetPage = () => {
  const { items, isLoading, error } = useBudgetItems();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <BudgetSummaryCard items={items} />
      <BudgetList items={items} />
    </div>
  );
};
```
