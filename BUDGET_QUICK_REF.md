# Budget Data - Quick Reference

## 📁 File Locations

- **Sample Data**: `/public/data/budget-sample.json`
- **Types**: `/src/app/components/event/budget/types/api.types.ts`
- **Service**: `/src/app/components/event/budget/services/budget.service.ts`
- **Context**: `/src/app/components/event/budget/contexts/BudgetContext.tsx`

## 🔌 API Endpoints (Backend)

```
GET    /api/budgets/:eventId
POST   /api/budgets/:eventId/expenses
PATCH  /api/budgets/:eventId/expenses/:id
DELETE /api/budgets/:eventId/expenses/:id
POST   /api/budgets/:eventId/categories
PATCH  /api/budgets/:eventId/categories/:id
DELETE /api/budgets/:eventId/categories/:id
```

## 💻 Usage in Components

```typescript
import { useBudget } from "../contexts/BudgetContext";

const { state, addExpense, updateExpense, deleteExpense } = useBudget();

// Access data
const total = state.summary?.total_budget;
const categories = state.categories;
const expenses = state.expenses;

// Add expense
addExpense({
  description: "Venue deposit",
  amount: 5000,
  category_id: "cat_001",
  vendor_name: "Dream Venue",
  expense_date: "2024-02-05",
  payment_status: "paid",
});
```

## 🗄️ Database Tables

1. **BUDGET** - Main budget record
2. **CATEGORIES_EXPENSES_BUDGETS** - Categories
3. **BUDGET_ITEMS** - Line items
4. **EXPENSES** - Transactions
5. **VENDORS** - Supplier info

## 🔢 Backend Calculations Required

- `total_budget` = SUM(categories.allocated)
- `total_spent` = SUM(expenses.amount)
- `total_remaining` = total_budget - total_spent
- `percentage_spent` = (total_spent / total_budget) \* 100
- `category.spent` = SUM(expenses.amount WHERE category_id)
- `vendor.total_spent` = SUM(expenses.amount WHERE vendor_id)
- Counts by payment_status

## 🌐 Environment Setup

```bash
# Development (uses local JSON)
# No config needed

# Production (uses backend API)
NEXT_PUBLIC_API_URL=https://your-api.com
```

## 📊 Sample Data Stats

- Event: Emma & Liam's Rustic Wedding
- Total: $45,000
- Spent: $32,500 (72%)
- Categories: 8
- Expenses: 15
- Vendors: 10

## 📚 Documentation

- `BUDGET_DATA_STRUCTURE.md` - Complete schema
- `INTEGRATION_GUIDE.md` - How-to guide
- `03_BUDGET_DATA_INTEGRATION.md` - Overview

## ✅ What's Working

- ✅ Data loads from JSON automatically
- ✅ All budget components populated
- ✅ Dashboard shows real statistics
- ✅ Categories with actual spending
- ✅ Expenses list with 15 items
- ✅ Vendor directory with 10 vendors
- ✅ Analytics and charts
- ✅ Full TypeScript support

## 🚀 Next: Connect Backend

1. Set `NEXT_PUBLIC_API_URL` environment variable
2. Backend implements endpoints
3. Returns data matching `BudgetDataAPI` type
4. Frontend switches automatically!
