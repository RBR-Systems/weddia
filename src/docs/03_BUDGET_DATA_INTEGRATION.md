# Budget System Data Integration

## Summary

The wedding budget management system now uses a comprehensive JSON data structure that mirrors the backend database schema. All data flows through a service layer that can work in both development (local JSON) and production (backend API) modes.

## Key Components

### 1. Data Structure (`/public/data/budget-sample.json`)

Complete sample budget data including:

- Event and budget metadata
- Summary with calculated totals and percentages
- 8 categories with allocations and spending
- 15 expenses with payment tracking
- 10 vendors with contact information
- Budget line items
- Payment schedule
- Analytics (monthly trends, top vendors, status breakdowns)

### 2. Type Definitions (`types/api.types.ts`)

TypeScript interfaces for:

- `BudgetDataAPI` - Main API response
- `ExpenseAPI`, `CategoryAPI`, `VendorAPI` - Entity types
- `BudgetSummaryAPI`, `AnalyticsAPI` - Calculated data
- Request/Response types for CRUD operations

### 3. Service Layer (`services/budget.service.ts`)

Handles all data communication:

- Development mode: Loads from local JSON
- Production mode: Calls backend API
- Methods for all CRUD operations
- Error handling and logging

### 4. Context Integration (`contexts/BudgetContext.tsx`)

- Updated to use `BudgetService`
- Loads data on mount
- Provides data and methods to all components
- Optimistic updates for better UX

## Database Schema (from CSV)

Based on the provided schema, the system implements:

**BUDGET**

- Main budget record per event
- Stores currency and notes

**CATEGORIES_EXPENSES_BUDGETS**

- Budget categories (Venue, Catering, etc.)
- Reusable across events

**BUDGET_ITEMS**

- Planned line items within categories
- Allocated amounts before actual expenses

**EXPENSES**

- Actual transactions/costs
- Links to categories and vendors
- Payment status tracking

**VENDORS**

- Supplier information
- Contact details and ratings
- Active status management

## Backend Responsibilities

The backend API should:

1. **Calculate Aggregations**:
   - Total budget (sum of category allocations)
   - Total spent (sum of expenses)
   - Remaining budget
   - Percentages
   - Counts by status/category

2. **Provide Analytics**:
   - Monthly spending trends
   - Top vendors by spending
   - Payment status breakdowns
   - Category performance

3. **Validate Data**:
   - Budget constraints
   - Category existence
   - Vendor references
   - Date validations

4. **Handle CRUD Operations**:
   - Expense management
   - Category allocation updates
   - Vendor management
   - Budget modifications

## Integration Points

### API Endpoints Required

```
GET    /api/budgets/:eventId              - Get complete budget data
PATCH  /api/budgets/:eventId              - Update budget settings
POST   /api/budgets/:eventId/expenses     - Create expense
PATCH  /api/budgets/:eventId/expenses/:id - Update expense
DELETE /api/budgets/:eventId/expenses/:id - Delete expense
POST   /api/budgets/:eventId/categories   - Create category
PATCH  /api/budgets/:eventId/categories/:id - Update category
DELETE /api/budgets/:eventId/categories/:id - Delete category
GET    /api/budgets/:eventId/vendors      - Get vendors
GET    /api/budgets/:eventId/analytics    - Get analytics
```

### Environment Configuration

```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

If not set, system runs in development mode with local JSON data.

## Current Status

✅ **Completed**:

- JSON data structure matching database schema
- TypeScript type definitions
- Service layer with API abstraction
- Context integration
- Sample data for development
- Documentation

⏳ **Pending**:

- Backend API implementation
- Authentication integration
- Error handling improvements
- Data validation
- Optimistic update rollback

## Usage Example

```typescript
// In any component
import { useBudget } from '../contexts/BudgetContext';

function ExpenseComponent() {
  const { state, addExpense } = useBudget();

  // Access data
  const { summary, categories, expenses } = state;

  // Add expense
  const handleAdd = () => {
    addExpense({
      description: "Venue deposit",
      amount: 5000,
      category_id: "cat_001",
      vendor_name: "Dream Venue",
      expense_date: "2024-02-05",
      payment_status: "paid"
    });
  };

  return (
    <div>
      <h2>Total Budget: ${summary?.total_budget}</h2>
      <h3>Spent: ${summary?.total_spent}</h3>
      {/* ... */}
    </div>
  );
}
```

## Files Reference

- `/public/data/budget-sample.json` - Sample data
- `/src/data/BUDGET_DATA_STRUCTURE.md` - Complete schema documentation
- `/src/data/INTEGRATION_GUIDE.md` - Integration instructions
- `/src/app/components/event/budget/types/api.types.ts` - Type definitions
- `/src/app/components/event/budget/services/budget.service.ts` - Service layer
- `/src/app/components/event/budget/contexts/BudgetContext.tsx` - Data context

## Benefits

1. **Type Safety**: Full TypeScript support for all data
2. **Separation of Concerns**: Service layer decouples API from UI
3. **Development Friendly**: Works without backend using local JSON
4. **Production Ready**: Simple environment variable switch for live API
5. **Maintainable**: Clear data flow and documentation
6. **Scalable**: Easy to add new features and endpoints

## Next Steps

1. Review sample data structure
2. Implement backend API endpoints
3. Add authentication to service layer
4. Test with production API
5. Add loading states and error boundaries
6. Implement optimistic updates with rollback
