# Wedding Budget Feature - Master Guide

## Purpose
This master guide provides the complete overview of the wedding budget management feature. It serves as the entry point for AI implementation and references all sub-feature implementation files.

---

## What We're Building

A comprehensive budget management interface for wedding planners and couples that includes:

- **Visual Dashboard** - See budget health at a glance with charts and metrics
- **Category System** - Organize budget into wedding categories (venue, catering, flowers, etc.)
- **Expense Tracking** - Record every expense with vendor, receipts, and payment status
- **Payment Management** - Track what's paid, pending, and overdue
- **Vendor Directory** - Manage vendor contacts and track spending per vendor
- **Analytics & Reports** - Visualize spending patterns and generate reports
- **Collaborative Tools** - Multiple users can view and manage the budget

---

## Who It's For

**Primary Users**:
1. **Couples** - Planning their own wedding, need simple budget tracking
2. **Professional Wedding Planners** - Managing budgets for multiple client weddings
3. **Collaborators** - Family/friends helping with wedding planning

**User Needs**:
- Couples need: Simple, visual, easy expense entry, mobile-friendly
- Planners need: Multi-client support, templates, detailed reports
- Collaborators need: View-only or limited edit access, notifications

---

## Technical Architecture

### Frontend Stack
- **Framework**: React with TypeScript
- **UI Library**: Ant Design (antd) - use exclusively for all UI components
- **State Management**: React Context API + useState/useReducer
- **Routing**: React Router
- **Charts**: Recharts (integrates well with Ant Design)
- **Forms**: Ant Design Form with validation
- **Data Persistence**: JSON files (backend handles this)

### Data Flow Pattern
```
User Action → Component → Context/State → JSON Read/Write → UI Update
                                    ↑
                          Backend provides calculated data
```

**Important**: Backend handles all complex calculations. Frontend focuses on:
- Displaying data beautifully
- Gathering user input
- Triggering data updates
- Providing great UX

### Folder Structure
```
src/
├── pages/
│   └── budget/
│       ├── BudgetDashboard.tsx
│       ├── CategoryManagement.tsx
│       ├── ExpenseTracking.tsx
│       ├── VendorManagement.tsx
│       ├── PaymentCalendar.tsx
│       └── Reports.tsx
├── components/
│   └── budget/
│       ├── dashboard/
│       ├── categories/
│       ├── expenses/
│       ├── vendors/
│       ├── payments/
│       ├── reports/
│       └── shared/
├── contexts/
│   ├── BudgetContext.tsx
│   └── EventContext.tsx
├── hooks/
│   ├── useBudgetData.ts
│   └── useExpenseActions.ts
├── utils/
│   ├── formatting.ts
│   └── constants.ts
└── types/
    └── budget.types.ts
```

---

## Data Structure Overview

### Backend Provides (via JSON):

**Budget Summary**:
```json
{
  "total_budget": 50000,
  "total_spent": 30000,
  "total_remaining": 20000,
  "percentage_spent": 60,
  "status": "on_track",
  "currency": "USD"
}
```

**Category with Stats**:
```json
{
  "category_id": "uuid",
  "name": "Venue",
  "allocated": 7500,
  "spent": 5000,
  "remaining": 2500,
  "percentage": 66.7,
  "expense_count": 2,
  "status": "on_track"
}
```

**Expense**:
```json
{
  "expense_id": "uuid",
  "description": "Venue Deposit",
  "amount": 5000,
  "category_name": "Venue",
  "vendor_name": "Grand Hotel",
  "expense_date": "2026-01-15",
  "payment_status": "paid",
  "receipt_urls": ["url1", "url2"]
}
```

**Frontend Responsibilities**:
- Display this data beautifully
- Provide forms to create/edit
- Handle user interactions
- Show loading/error states
- Make responsive

---

## Implementation Sequence

### Phase 1: Foundation (Files 01-04) ✅ COMPLETE
- Data structure and types
- Layout and navigation
- Shared component library
- Display utilities

### Phase 2: Core Features (Files 05-09)
- Budget dashboard
- Category management
- Budget allocation
- Expense tracking
- Expense details

### Phase 3: Vendor & Payments (Files 10-13)
- Vendor management
- Vendor-expense linking
- Payment status tracking
- Payment calendar

### Phase 4: Analytics (Files 14-16)
- Budget charts
- Reports and exports
- Budget insights

### Phase 5: Advanced Features (Files 17-20)
- Budget templates
- Budget estimator
- Collaborative features
- Mobile optimization

### Phase 6: Planner Tools (Files 21-22)
- Multi-client dashboard
- Bulk operations

### Phase 7: Final Features (Files 23-24)
- User preferences
- Edge case handling

---

## Design System

### Ant Design Components to Use

**Layout & Structure**:
- Layout, Header, Sider, Content, Footer
- Row, Col (grid system)
- Space (spacing utility)
- Divider

**Navigation**:
- Menu (sidebar navigation)
- Breadcrumb
- Tabs
- Pagination

**Data Display**:
- Table (expense lists)
- Card (dashboard cards, category cards)
- Statistic (metrics display)
- Descriptions (detail views)
- Tag (status indicators)
- Badge (counts, notifications)
- Timeline (activity log)
- Progress (budget bars)

**Data Entry**:
- Form (all forms)
- Input, InputNumber (text and number entry)
- Select (dropdowns)
- DatePicker, RangePicker (dates)
- Switch (toggles)
- Upload (receipt uploads)
- Radio, Checkbox (selections)

**Feedback**:
- Modal (confirmations, forms)
- Drawer (detail views)
- Message (success/error toasts)
- Notification (alerts)
- Alert (warnings, info boxes)
- Spin (loading indicators)
- Skeleton (loading placeholders)
- Empty (no data states)
- Result (success/error pages)

**Charts** (via Recharts):
- PieChart (category breakdown)
- BarChart (budget vs actual)
- LineChart (spending trends)
- AreaChart (cumulative spending)

### Color Palette

**Status Colors**:
- On Track: `#52c41a` (green-6)
- At Risk: `#fa8c16` (orange-6)
- Over Budget: `#ff4d4f` (red-6)
- Not Started: `#d9d9d9` (gray-4)

**Payment Status Colors**:
- Paid: `#52c41a` (green-6)
- Pending: `#faad14` (gold-6)
- Overdue: `#ff4d4f` (red-6)
- Partial: `#1890ff` (blue-6)

**Category Colors** (assign to different categories):
- Use Ant Design color palette (blue, purple, cyan, green, magenta, red, volcano, orange, gold, lime)

### Typography Scale
- Page Title: 24px, bold
- Section Header: 20px, semi-bold
- Card Title: 16px, medium
- Body Text: 14px, regular
- Small Text: 12px (metadata, captions)
- Large Numbers: 32px (dashboard statistics)

### Spacing System
- xs: 8px
- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px

---

## User Interaction Patterns

### Common User Flows

**Flow 1: First Time Budget Setup**
1. User lands on empty budget dashboard
2. See "Get Started" prompt
3. Click "Set Up Budget"
4. Enter total budget amount
5. See suggested category allocations
6. Adjust allocations as needed
7. Save budget
8. Dashboard now shows budget overview

**Flow 2: Adding an Expense**
1. Click "Add Expense" button (anywhere)
2. Modal opens with form
3. Fill in: description, amount, category, date
4. Optionally: select vendor, upload receipt, add notes
5. Click "Save"
6. See success message
7. Expense appears in list
8. Dashboard updates automatically

**Flow 3: Checking Budget Health**
1. Open dashboard
2. See total budget vs spent immediately
3. See color-coded status (green/orange/red)
4. See which categories are over budget
5. See upcoming payments
6. Click category to see details

**Flow 4: Managing Payments**
1. Go to Payments section
2. See calendar with due dates marked
3. See overdue payments highlighted
4. Click expense to mark as paid
5. Enter payment date and method
6. Save
7. Status updates everywhere

---

## Responsive Design Strategy

### Breakpoints
- **Mobile**: < 576px (1 column, bottom tabs)
- **Tablet**: 576-992px (2 columns, collapsible sidebar)
- **Desktop**: 992-1200px (3 columns, sidebar always visible)
- **Large Desktop**: > 1200px (3-4 columns, wider layout)

### Mobile Adaptations
- Replace data tables with card views
- Use bottom tab navigation instead of sidebar
- Simplify charts (fewer data points, larger touch targets)
- Use drawers instead of modals (better for mobile)
- Add floating action button for quick expense entry
- Enable swipe gestures (swipe to delete, swipe to mark paid)

### Touch Targets
- Minimum size: 44px × 44px
- Spacing between buttons: 8px minimum
- Larger form inputs on mobile: 40px height

---

## Component Reusability

### Build Once, Use Everywhere

**CurrencyDisplay** - Used in:
- Dashboard statistics
- Expense list
- Category cards
- Vendor spending
- Reports

**StatusBadge** - Used in:
- Dashboard
- Category list
- Expense list
- Reports

**ProgressBar** - Used in:
- Dashboard
- Category cards
- Budget allocation
- Analytics

**This pattern saves development time and ensures consistency.**

---

## File Implementation Order

### Must Follow This Sequence:

**Files 01-04**: Foundation (COMPLETE)
- Set up data types and utilities first
- Everything else depends on these

**Files 05-09**: Core Budget Features
- Implement in order - each builds on previous
- 05 (Dashboard) needs 06-07 (Categories)
- 08-09 (Expenses) need 06 (Categories)

**Files 10-11**: Vendor Features
- Require expense tracking to be complete
- Can be done in parallel

**Files 12-13**: Payment Features
- Require expense tracking
- Can be done in parallel with vendors

**Files 14-16**: Analytics
- Require all core features complete
- Build on top of existing data

**Files 17-20**: Advanced Features
- Require all core features
- Each is independent

**Files 21-22**: Planner Tools
- Require all features complete
- Optional for MVP

**Files 23-24**: Final Polish
- Last to implement
- Refinements and edge cases

---

## Success Criteria

### MVP is Ready When:

✅ User can set up initial budget
✅ User can add categories
✅ User can add expenses
✅ User can see dashboard with charts
✅ User can view expense list
✅ User can mark expenses as paid
✅ User can see budget vs actual
✅ Mobile version works smoothly
✅ Data persists correctly

### Full Feature Complete When:

✅ All 24 files implemented
✅ Vendor management works
✅ Payment calendar functional
✅ Reports generate correctly
✅ Templates save and load
✅ Multi-user collaboration works
✅ Mobile experience is excellent
✅ Performance is smooth

---

## Getting Started

### For AI Agent:

1. **Read this master guide completely**
2. **Understand the vision and architecture**
3. **Note that backend handles calculations** - focus on UI
4. **Start with File 01** and proceed sequentially
5. **Each file has step-by-step instructions** - follow them
6. **Use Ant Design exclusively** - don't create custom components when antd has them
7. **Make it beautiful** - wedding planning is visual, emotional
8. **Think mobile-first** - many users will use phones

### What Each File Contains:

- **Overview** - What this feature does
- **Goals** - What you're building
- **Step-by-step instructions** - How to build it
- **Component specifications** - What components to create
- **Layout descriptions** - How to arrange UI
- **User interaction flows** - How users use the feature
- **Design requirements** - Colors, spacing, typography
- **Next steps** - What file comes next

---

## Key Principles

### 1. Backend Does Heavy Lifting
Don't implement complex business logic in frontend. Examples:
- Budget calculations → Backend provides calculated values
- Data aggregations → Backend provides aggregated data
- Validation rules → Backend validates, frontend shows errors
- Permissions → Backend enforces, frontend hides/shows UI

### 2. Focus on User Experience
Your job is to make the data look beautiful and interactions smooth:
- Instant feedback on actions
- Smooth transitions and animations
- Clear error messages
- Helpful empty states
- Intuitive navigation

### 3. Use Ant Design Properly
- Don't reinvent wheels - use antd components
- Follow antd patterns and best practices
- Customize with theme tokens, not custom CSS
- Use antd icons consistently

### 4. Mobile-First Mindset
- Design for mobile, enhance for desktop
- Touch-friendly interactions
- Simplified mobile layouts
- Responsive components

### 5. Accessibility Matters
- Proper labels and ARIA attributes
- Keyboard navigation
- Screen reader friendly
- Color contrast compliance

---

## Data Assumptions

### What Backend Provides:

1. **Calculated Totals** - No need to sum expenses manually
2. **Budget Status** - Pre-calculated (on_track, at_risk, over_budget)
3. **Percentage Values** - Already calculated
4. **Filtered Data** - Backend can filter before sending
5. **Sorted Data** - Backend can sort before sending
6. **Aggregated Statistics** - Expense counts, category totals, etc.
7. **Vendor Information** - Joined with expenses when needed

### What Frontend Does:

1. **Display Data** - Show it beautifully
2. **Collect Input** - Forms with validation
3. **Handle Interactions** - Clicks, navigation, modals
4. **Show Feedback** - Loading, success, error states
5. **Format for Display** - Currency, dates, percentages
6. **Manage UI State** - Open/closed modals, selected items, filters

---

## Complete File List

### Phase 1: Foundation ✅
- **00_MASTER_GUIDE.md** - This file
- **01_SETUP_AND_CONFIGURATION.md** - Project setup, Ant Design config
- **02_LAYOUT_STRUCTURE.md** - Main layout, navigation, routing
- **03_SHARED_COMPONENTS.md** - Reusable display components
- **04_FORMATTING_UTILITIES.md** - Currency, date, number formatting

### Phase 2: Core Features
- **05_DASHBOARD.md** - Main budget overview page
- **06_CATEGORY_LIST.md** - View and manage categories
- **07_BUDGET_ALLOCATION.md** - Allocate budget to categories
- **08_EXPENSE_LIST.md** - Table view of all expenses
- **09_ADD_EDIT_EXPENSE.md** - Expense form modal
- **10_EXPENSE_DETAILS.md** - Detailed expense view with receipts

### Phase 3: Vendor Features
- **11_VENDOR_LIST.md** - Vendor directory
- **12_VENDOR_DETAILS.md** - Vendor profile with expenses

### Phase 4: Payment Features
- **13_PAYMENT_STATUS.md** - Payment tracking interface
- **14_PAYMENT_CALENDAR.md** - Calendar view of payments

### Phase 5: Analytics
- **15_BUDGET_CHARTS.md** - Pie, bar, and line charts
- **16_REPORTS_PAGE.md** - Generate and export reports

### Phase 6: Advanced Features
- **17_BUDGET_TEMPLATES.md** - Save and load templates
- **18_BUDGET_ESTIMATOR.md** - Suggest budget allocations
- **19_ACTIVITY_LOG.md** - Track who changed what
- **20_NOTIFICATIONS.md** - Alerts and reminders

### Phase 7: Planner Tools
- **21_MULTI_CLIENT_VIEW.md** - Manage multiple wedding budgets
- **22_BULK_OPERATIONS.md** - Import/export, bulk edits

### Phase 8: Final Polish
- **23_MOBILE_OPTIMIZATION.md** - Mobile-specific features
- **24_USER_PREFERENCES.md** - Settings and customization

---

## Design Guidelines

### Visual Hierarchy
1. **Most Important** - Total budget, remaining funds, critical alerts
2. **Important** - Category summaries, recent expenses, upcoming payments
3. **Supporting** - Detailed breakdowns, historical data, settings

### Information Density
- **Dashboard** - High-level overview, not too cluttered
- **List Views** - Medium density, show key info
- **Detail Views** - High density, show everything

### Interactive Elements
- **Primary Actions** - Large, prominent buttons (Add Expense, Save Budget)
- **Secondary Actions** - Normal buttons (Edit, Export)
- **Tertiary Actions** - Icon buttons, links (Delete, View)

---

## Common UI Patterns

### Pattern 1: Dashboard Card
```
┌─────────────────────────────┐
│ Icon  Title          Amount │
│       Subtitle       +15%   │
└─────────────────────────────┘
```
Use: Statistics, summary metrics

### Pattern 2: List with Actions
```
┌──────────────────────────────────┐
│ [Filters] [Search] [Add Button] │
├──────────────────────────────────┤
│ Table or Cards                   │
│ ...                              │
│ ...                              │
├──────────────────────────────────┤
│ Pagination                       │
└──────────────────────────────────┘
```
Use: Expense list, vendor list, category list

### Pattern 3: Detail Drawer
```
     ┌──────────────────────┐
     │ × Close      Actions │
     ├──────────────────────┤
     │ Title                │
     │                      │
     │ Section 1            │
     │ ...                  │
     │                      │
     │ Section 2            │
     │ ...                  │
     │                      │
     │ [Action Buttons]     │
     └──────────────────────┘
```
Use: Expense details, vendor details

### Pattern 4: Form Modal
```
    ┌───────────────────┐
    │ Title       × Close│
    ├───────────────────┤
    │ Form Fields       │
    │ ...               │
    │ ...               │
    ├───────────────────┤
    │ [Cancel] [Save]   │
    └───────────────────┘
```
Use: Add/edit forms (expense, category, vendor)

---

## State Management Strategy

### Context Structure

**BudgetContext** provides:
- budgetSummary (summary stats)
- categories (all categories with stats)
- expenses (all expenses)
- vendors (all vendors)
- isLoading (boolean)
- error (error object or null)
- refreshData() (reload all data)
- addExpense(data)
- updateExpense(id, data)
- deleteExpense(id)
- updateAllocation(categoryId, amount)

**EventContext** provides:
- currentEventId
- eventDetails
- userRole
- permissions

### Local Component State

Each component manages its own UI state:
- Modal open/closed
- Selected rows in table
- Form field values
- Active tab
- Filter selections

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Load Heavy Components**
   - Charts load only when visible
   - Detail drawers load content on open
   - Images load on scroll

2. **Paginate Long Lists**
   - Expense table: 20 items per page
   - Vendor list: 20 items per page
   - Don't render 1000 rows at once

3. **Debounce Search Input**
   - Wait 300ms after user stops typing
   - Prevents excessive re-renders

4. **Memoize Expensive Renders**
   - Use React.memo for pure components
   - Use useMemo for calculations
   - Use useCallback for event handlers

5. **Optimize Images**
   - Compress receipt uploads
   - Use thumbnails for preview
   - Lazy load full-size images

---

## Error Handling Approach

### Error States to Handle

1. **Data Load Failed**
   - Show error message
   - Provide retry button
   - Don't show broken UI

2. **Save Failed**
   - Show error notification
   - Don't close form
   - Preserve user input
   - Suggest retry

3. **Validation Failed**
   - Highlight invalid fields
   - Show specific error messages
   - Prevent submission
   - Guide user to fix

4. **Network Error**
   - Show offline indicator
   - Queue actions for when online
   - Inform user of status

### User-Friendly Error Messages

❌ Bad: "Error 422: Validation failed on field expense_date"
✅ Good: "Please enter a valid date for this expense"

❌ Bad: "Cannot DELETE expense due to FK constraint"
✅ Good: "This expense can't be deleted because it has scheduled payments"

---

## Accessibility Requirements

### Must-Haves

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter to activate buttons
   - Escape to close modals
   - Arrow keys in menus

2. **Screen Reader Support**
   - Proper ARIA labels
   - Announce state changes
   - Describe charts in text
   - Label all form fields

3. **Color Contrast**
   - Text: 4.5:1 ratio minimum
   - UI elements: 3:1 ratio minimum
   - Don't rely on color alone

4. **Focus Indicators**
   - Visible focus outline
   - Logical tab order
   - Focus management in modals

---

## Starting Your Implementation

### Step-by-Step Process

1. ✅ Read this master guide thoroughly
2. ✅ Understand the overall architecture
3. ✅ Note the data flow (backend calculates, frontend displays)
4. ✅ Review Ant Design documentation
5. → Start with **File 01: SETUP_AND_CONFIGURATION.md**
6. → Proceed sequentially through Files 02-24
7. → Build, review, refine each feature
8. → Move to next file only when current is complete

### For Each Implementation File:

1. Read the entire file first
2. Understand the goal
3. Review component specifications
4. Follow step-by-step instructions
5. Use Ant Design components as specified
6. Make it responsive
7. Handle loading and error states
8. Add helpful user feedback
9. Review for accessibility
10. Mark file as complete

---

## Important Reminders

### Do's
✅ Use Ant Design components exclusively
✅ Follow the file sequence
✅ Make every view responsive
✅ Add loading states
✅ Show helpful errors
✅ Format currency properly
✅ Make it visually appealing
✅ Think about the user experience

### Don'ts
❌ Skip foundation files
❌ Implement complex calculations (backend does this)
❌ Create custom UI when antd has it
❌ Ignore mobile users
❌ Forget accessibility
❌ Show technical errors to users
❌ Make assumptions about data structure
❌ Deviate from the plan without reason

---

## Questions Before Starting?

If anything is unclear:
- Re-read the relevant section
- Check the specific implementation file
- Review Ant Design documentation
- Refer to data structure in File 01

**Ready to begin?**

→ **Proceed to File 01: SETUP_AND_CONFIGURATION.md**

---

**Document Version**: 1.0  
**Created**: 2026-02-05  
**Total Files**: 25 (00-24)  
**Estimated Total Time**: 80-100 hours for complete implementation
