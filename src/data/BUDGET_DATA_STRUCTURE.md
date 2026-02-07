# Budget Data Structure

## Overview

This document describes the data structure for the wedding budget management system, based on the database schema and how data flows from backend to frontend.

## Database Tables

### 1. BUDGET

Main budget record for an event.

- `budget_id` (PK, UUID): Unique budget identifier
- `event_id` (FK, UUID): Reference to event
- `currency` (string): Currency code (USD, EUR, etc.)
- `notes` (text): Additional notes
- Timestamps: `created_at`, `updated_at`, `created_by`, `updated_by`

### 2. CATEGORIES_EXPENSES_BUDGETS

Budget categories (Venue, Catering, Photography, etc.)

- `category_id` (PK, UUID): Unique category identifier
- `name` (string): Category name
- `description` (string): Category description
- Timestamps: `created_at`, `updated_at`, `created_by`, `updated_by`

### 3. BUDGET_ITEMS

Line items within budget categories (planned allocations)

- `budget_item_id` (PK, UUID): Unique item identifier
- `budget_id` (FK, UUID): Reference to budget
- `category_id` (FK, UUID): Reference to category
- `description` (string): Item description
- `amount` (decimal): Allocated amount
- `notes` (text): Additional notes
- Timestamps: `created_at`, `updated_at`, `created_by`, `updated_by`

### 4. EXPENSES

Actual expenses/transactions

- `expense_id` (PK, UUID): Unique expense identifier
- `event_id` (FK, UUID): Reference to event
- `category_id` (FK, UUID): Reference to category
- `vendor_id` (FK, UUID): Reference to vendor
- `description` (string): Expense description
- `amount` (decimal): Expense amount
- `expense_date` (date): Date of expense
- `currency` (string): Currency code
- `notes` (text): Additional notes
- `receipt_url` (string): URL to receipt/invoice
- Timestamps: `created_at`, `updated_at`, `created_by`, `updated_by`

### 5. VENDORS

Vendor/supplier information

- `vendor_id` (UUID): Unique vendor identifier
- `name` (string): Vendor name
- `category` (string): Vendor category
- `contact_person` (string): Primary contact
- `email` (string): Contact email
- `phone` (number): Contact phone
- `address` (string): Vendor address
- `notes` (string): Additional notes
- `rating` (decimal): Vendor rating
- `is_active` (boolean): Active status
- Timestamps: `created_at`, `updated_at`, `created_by`, `updated_by`

## API Response Structure

### GET /api/budgets/:eventId

The backend API should return a comprehensive response with all budget data and calculated fields:

```json
{
  "event_id": "string",
  "event_name": "string",
  "budget": {
    "budget_id": "string",
    "event_id": "string",
    "currency": "string",
    "notes": "string",
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "created_by": "UUID",
    "updated_by": "UUID"
  },
  "summary": {
    "total_budget": "number (calculated from categories.allocated sum)",
    "total_allocated": "number",
    "total_spent": "number (calculated from expenses sum)",
    "total_remaining": "number (calculated: total_budget - total_spent)",
    "percentage_spent": "number (calculated: (total_spent / total_budget) * 100)",
    "percentage_allocated": "number",
    "status": "on_track | at_risk | over_budget | not_started",
    "currency": "string",
    "expense_count": "number (count of expenses)",
    "vendor_count": "number (count of unique vendors)",
    "paid_count": "number (count where payment_status = paid)",
    "pending_count": "number (count where payment_status = pending)",
    "overdue_count": "number (count where payment_status = overdue)"
  },
  "categories": [
    {
      "category_id": "string",
      "name": "string",
      "description": "string",
      "allocated": "number",
      "spent": "number (calculated from expenses sum for this category)",
      "remaining": "number (calculated: allocated - spent)",
      "percentage": "number (% of total budget)",
      "percentage_of_spent": "number (% of total spent)",
      "expense_count": "number (count of expenses in this category)",
      "color": "string (hex color for UI)",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "expenses": [
    {
      "expense_id": "string",
      "event_id": "string",
      "category_id": "string",
      "vendor_id": "string | null",
      "vendor_name": "string",
      "description": "string",
      "amount": "number",
      "expense_date": "YYYY-MM-DD",
      "payment_status": "paid | pending | overdue | partial | cancelled",
      "currency": "string",
      "notes": "string",
      "receipt_url": "string | null",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "created_by": "UUID",
      "updated_by": "UUID"
    }
  ],
  "vendors": [
    {
      "vendor_id": "string",
      "name": "string",
      "category": "string",
      "contact_person": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "notes": "string",
      "rating": "number",
      "is_active": "boolean",
      "total_spent": "number (calculated from expenses for this vendor)",
      "expense_count": "number (count of expenses for this vendor)",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "budget_items": [
    {
      "budget_item_id": "string",
      "budget_id": "string",
      "category_id": "string",
      "description": "string",
      "amount": "number",
      "notes": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "payment_schedule": [
    {
      "payment_id": "string",
      "expense_id": "string",
      "due_date": "YYYY-MM-DD",
      "amount": "number",
      "status": "paid | pending | overdue",
      "notes": "string"
    }
  ],
  "analytics": {
    "spending_by_month": [
      {
        "month": "YYYY-MM",
        "amount": "number",
        "expense_count": "number"
      }
    ],
    "top_vendors": [
      {
        "vendor_id": "string",
        "vendor_name": "string",
        "total_spent": "number",
        "percentage": "number"
      }
    ],
    "payment_status_breakdown": {
      "paid": { "count": "number", "total": "number", "percentage": "number" },
      "pending": {
        "count": "number",
        "total": "number",
        "percentage": "number"
      },
      "overdue": {
        "count": "number",
        "total": "number",
        "percentage": "number"
      },
      "partial": {
        "count": "number",
        "total": "number",
        "percentage": "number"
      }
    },
    "category_trends": {
      "most_spent": "string (category name)",
      "most_remaining": "string (category name)",
      "on_budget_count": "number",
      "over_budget_count": "number",
      "under_budget_count": "number"
    }
  }
}
```

## Backend Calculations

The backend should calculate the following fields:

1. **Summary Calculations**:
   - `total_budget`: SUM of all `categories.allocated`
   - `total_spent`: SUM of all `expenses.amount`
   - `total_remaining`: `total_budget - total_spent`
   - `percentage_spent`: `(total_spent / total_budget) * 100`
   - `status`: Based on percentage_spent thresholds

2. **Category Calculations**:
   - `spent`: SUM of `expenses.amount` WHERE `category_id` matches
   - `remaining`: `allocated - spent`
   - `percentage`: `(allocated / total_budget) * 100`
   - `percentage_of_spent`: `(spent / total_spent) * 100`
   - `expense_count`: COUNT of expenses for this category

3. **Vendor Calculations**:
   - `total_spent`: SUM of `expenses.amount` WHERE `vendor_id` matches
   - `expense_count`: COUNT of expenses for this vendor

4. **Analytics**:
   - Monthly aggregations
   - Top vendors by spending
   - Payment status breakdowns
   - Category trends

## API Endpoints

### Budget Operations

- `GET /api/budgets/:eventId` - Get complete budget data
- `PATCH /api/budgets/:eventId` - Update budget settings
- `POST /api/budgets/:eventId/categories` - Create category
- `PATCH /api/budgets/:eventId/categories/:categoryId` - Update category
- `DELETE /api/budgets/:eventId/categories/:categoryId` - Delete category

### Expense Operations

- `POST /api/budgets/:eventId/expenses` - Create expense
- `PATCH /api/budgets/:eventId/expenses/:expenseId` - Update expense
- `DELETE /api/budgets/:eventId/expenses/:expenseId` - Delete expense

### Vendor Operations

- `GET /api/budgets/:eventId/vendors` - Get vendors list
- `POST /api/budgets/:eventId/vendors` - Create vendor
- `PATCH /api/budgets/:eventId/vendors/:vendorId` - Update vendor

### Analytics

- `GET /api/budgets/:eventId/analytics` - Get analytics data

## Frontend Data Flow

1. **Initial Load**:
   - BudgetContext calls `BudgetService.getBudgetData(eventId)`
   - Service fetches from API (or local JSON in development)
   - Data is transformed and stored in context state

2. **User Actions**:
   - Add/Edit/Delete operations update local state immediately (optimistic updates)
   - Service methods call backend API
   - On success, state remains updated
   - On error, state is rolled back and error is shown

3. **Data Refresh**:
   - After mutations, can optionally reload full data from backend
   - Ensures frontend stays in sync with backend calculations

## Development vs Production

**Development Mode** (no API_BASE_URL):

- Loads data from `/public/data/budget-sample.json`
- Mutations log to console but don't persist
- Useful for frontend development without backend

**Production Mode** (with API_BASE_URL):

- All operations call backend API
- Data persists to database
- Backend handles calculations and validation

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.yourbackend.com
```

If not set, system runs in development mode with local JSON data.
