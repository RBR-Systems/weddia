# GitHub Copilot — Wedding App Workspace Instructions

This is a wedding planning application built with **React + TypeScript + .NET**.

## Project Architecture

Code is organized as **vertical slices by feature**, not by technical role.

```
src/
├── features/
│   ├── budget/
│   │   ├── components/       # Presentational UI only
│   │   ├── hooks/            # Stateful logic (useBudgetItems.ts)
│   │   ├── api/              # All HTTP calls (budgetApi.ts)
│   │   ├── models/           # TypeScript types (budget.models.ts)
│   │   ├── constants/        # Named constants (budget.constants.ts)
│   │   ├── utils/            # Pure helpers (budget.utils.ts)
│   │   └── BudgetPage.tsx    # Route entry point
│   ├── guests/
│   └── vendors/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── models/
│   ├── constants/
│   ├── utils/
│   └── api/                  # Base API client / interceptors
└── app/
    ├── router.tsx
    ├── providers.tsx
    └── App.tsx
```

## Where Things Go — Non-Negotiable Rules

- **`api/`** — The ONLY place `fetch` or `axios` is called. Never in components, never in hooks directly.
- **`models/`** — All TypeScript `interface` and `type` definitions. Never inline in component files.
- **`constants/`** — All named values. No magic numbers or strings anywhere else.
- **`utils/`** — Pure functions only. No React, no side effects, no API calls.
- **`hooks/`** — Stateful logic and side effects. Calls `api/` functions, manages local state.
- **`components/`** — UI only. Receives data via props, emits events via callbacks.
- **`shared/`** — Anything used by 2 or more features.

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Feature page | PascalCase | `BudgetPage.tsx` |
| Component | PascalCase | `BudgetItemRow.tsx` |
| Hook | `use` prefix, camelCase | `useBudgetItems.ts` |
| API module | camelCase, `Api` suffix | `budgetApi.ts` |
| Models | camelCase, `.models` suffix | `budget.models.ts` |
| Constants | camelCase, `.constants` suffix | `budget.constants.ts` |
| Utils | camelCase, `.utils` suffix | `budget.utils.ts` |

## Code Generation Rules

When generating or suggesting code, always:

1. **No `any` type** — every value must be typed explicitly
2. **No magic literals** — reference a constant from `*.constants.ts`
3. **No `fetch` in components** — suggest creating/using an `api/` function
4. **No inline type definitions** — suggest placing them in `models/`
5. **File size awareness** — if a file exceeds 200 lines, suggest splitting
6. **Always handle all four states** for async data: `loading`, `error`, `empty`, `data`
7. **No index keys** on dynamic lists — use stable unique IDs
8. **No `useEffect` to derive state** — compute inline or use `useMemo`
9. **Cleanup effects** — every `useEffect` that subscribes must return a cleanup function
