# Budget Data Integration Guide

## Overview

The budget system now uses a comprehensive JSON data structure that mirrors the backend database schema. All budget data is loaded from `/public/data/budget-sample.json` in development mode, and from the backend API in production.

## Files Created

### 1. Data Structure

- **`/public/data/budget-sample.json`**: Complete sample budget data with all tables
- **`/src/data/budget-sample.json`**: Source file (copied to public)
- **`/src/data/BUDGET_DATA_STRUCTURE.md`**: Comprehensive documentation

### 2. Type Definitions

- **`/src/app/components/event/budget/types/api.types.ts`**: TypeScript interfaces for API responses

### 3. Service Layer

- **`/src/app/components/event/budget/services/budget.service.ts`**: API communication layer
- **`/src/app/components/event/budget/services/index.ts`**: Export file

### 4. Context Updates

- **`/src/app/components/event/budget/contexts/BudgetContext.tsx`**: Updated to use BudgetService

## How It Works

### Data Flow

```
Backend API → BudgetService → BudgetContext → Components
```

### Development Mode (Current)

1. Application loads
2. `BudgetContext` calls `BudgetService.getBudgetData('event_001')`
3. Service detects no API_BASE_URL and loads from `/public/data/budget-sample.json`
4. Data is transformed and provided to all budget components
5. Mutations (add/edit/delete) update local state only

### Production Mode (Future)

1. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-api.com`
2. `BudgetService` will call backend endpoints
3. All CRUD operations will persist to database
4. Backend performs calculations and returns updated data

## Using the Budget Data

### In Components

```typescript
import { useBudget } from '../contexts/BudgetContext';

function MyComponent() {
  const { state, addExpense, updateExpense, deleteExpense } = useBudget();

  // Access data
  const totalBudget = state.summary?.total_budget;
  const categories = state.categories;
  const expenses = state.expenses;

  // Create expense
  const handleAddExpense = () => {
    addExpense({
      description: "New expense",
      amount: 1000,
      category_id: "cat_001",
      vendor_name: "Vendor Name",
      expense_date: "2024-02-05",
      payment_status: "pending"
    });
  };

  return <div>{/* Your UI */}</div>;
}
```

### Available Context Methods

- `loadBudgetData(eventId)` - Reload budget data
- `refreshData()` - Refresh current data
- `addExpense(expense)` - Add new expense
- `updateExpense(id, updates)` - Update expense
- `deleteExpense(id)` - Delete expense
- `addCategory(category)` - Add new category
- `updateCategory(id, updates)` - Update category
- `deleteCategory(id)` - Delete category
- `updateBudget(totalBudget)` - Update overall budget
- `loadTemplate(template)` - Load budget template
- `loadEstimate(estimate)` - Load budget estimate

### State Structure

```typescript
state = {
  isLoading: boolean,
  error: string | null,
  summary: {
    total_budget: number,
    total_spent: number,
    total_remaining: number,
    percentage_spent: number,
    status: "on_track" | "at_risk" | "over_budget" | "not_started",
    currency: string,
    expense_count: number,
    vendor_count: number,
    paid_count: number,
    pending_count: number,
    overdue_count: number,
  },
  categories: Array<{
    id: string;
    name: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentage: number;
    expense_count: number;
    color: string;
  }>,
  expenses: Array<{
    expense_id: string;
    description: string;
    amount: number;
    category_id: string;
    vendor_name: string;
    expense_date: string;
    payment_status: "paid" | "pending" | "overdue" | "partial";
    receipt_urls: string[];
  }>,
  currency: "USD" | "EUR" | "GBP" | "MXN" | "CAD",
};
```

## Database Schema Reference

The JSON structure follows these database tables:

1. **BUDGET** - Main budget record
2. **CATEGORIES_EXPENSES_BUDGETS** - Budget categories
3. **BUDGET_ITEMS** - Planned budget line items
4. **EXPENSES** - Actual expenses/transactions
5. **VENDORS** - Vendor information

All calculated fields (totals, percentages, counts) are computed by the backend.

## Sample Data Included

The sample JSON includes:

- Complete budget for "Emma & Liam's Rustic Wedding"
- $45,000 total budget with $32,500 spent
- 8 categories with allocations
- 15 expenses across multiple vendors
- 10 vendors with contact information
- Budget items breakdown
- Payment schedule
- Analytics data (monthly spending, top vendors, trends)

## Next Steps for Backend Integration

1. **Set up environment variable**:

   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com
   ```

2. **Backend should implement these endpoints**:
   - `GET /api/budgets/:eventId` - Return complete budget data
   - `POST /api/budgets/:eventId/expenses` - Create expense
   - `PATCH /api/budgets/:eventId/expenses/:id` - Update expense
   - `DELETE /api/budgets/:eventId/expenses/:id` - Delete expense
   - `POST /api/budgets/:eventId/categories` - Create category
   - `PATCH /api/budgets/:eventId/categories/:id` - Update category
   - `DELETE /api/budgets/:eventId/categories/:id` - Delete category

3. **Backend calculations required**:
   - Sum all expenses by category
   - Calculate totals and percentages
   - Aggregate analytics data
   - Compute payment status counts

4. **Authentication**: Add JWT or session tokens to requests in `budget.service.ts`

## Testing

The budget system now loads real data on startup. Navigate to the budget page to see:

- Dashboard with actual summary statistics
- Categories with real allocations and spending
- Expenses list with all 15 sample expenses
- Vendor directory with 10 vendors
- Analytics with charts based on real data
- Payment tracking
- All other budget features

## Troubleshooting

**Data not loading**: Check browser console for errors. Ensure `/public/data/budget-sample.json` exists.

**404 on budget-sample.json**: File must be in `/public/data/` folder to be served by Next.js.

**Type errors**: Ensure all imports from `types/api.types.ts` are correct.

**State not updating**: Check that `BudgetContext` is properly wrapping your components.
