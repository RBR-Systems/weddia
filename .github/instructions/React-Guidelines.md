---
applyTo: "**/*.ts,**/*.tsx"
---

# GitHub Copilot Instructions — Next.js App Router Project

These instructions define how GitHub Copilot should generate code for this repository.  
Follow these rules strictly.

## 🧠 State Management & Performance

### Reducers

- Prefer `useReducer` over large `useState` objects for complex state.
- Use reducers for:
  - Related pieces of state
  - Multi-step workflows
  - Non-trivial update logic
- Reducers must be:
  - Pure functions
  - Colocated with the feature that owns the state

### Context

- Use React Context only for **global concerns**:
  - Auth
  - Theme
  - User
  - Feature flags
- Do NOT use Context for local UI state.
- Avoid deeply nested Context providers.
- Prefer feature-level contexts over app-wide ones when possible.

### Memoization

- Use `useMemo` for:
  - Expensive computations
  - Derived values
- Use `useCallback` for:
  - Functions passed to child components
- Use `React.memo` for:
  - Presentational components with stable props
- Do NOT memoize prematurely.

---

## 🧩 Architecture — Vertical Slice

Use a **vertical slice** structure:

```

app/
└── components/
└── events/        ← Pages / Routes
└── feature/  ← Feature folder
├── components/
├── hooks/
├── utils/
├── data/
├── models/
├── services/
├── FeatureComponent.tsx
└── index.ts

```

### Rules

- Each feature is **self-contained**
- No global “mega” utils folders
- UI, logic, hooks, and models must live near the feature that uses them
- Avoid cross-feature imports

---

## 🗂 File & Component Rules

### Small Files Only

- Each file must:
  - Have a single responsibility
  - Be under ~150 lines
  - Do one thing well

### Pages (Next.js App Router)

- Pages should:
  - Compose components
  - Handle routing and layout only
- Pages must NOT:
  - Contain business logic

### Models

- All types, interfaces, and schemas live in:

```

feature/models/

```

### Hooks

```

feature/hooks/

```

### Utils

```

feature/utils/

```

---

## 🧱 Component Design

- Prefer **composition over inheritance**
- No giant components
- Split into:
  - **Container** components → logic
  - **View** components → UI only

---

## 🧼 Code Style

- Use TypeScript strictly
- Avoid `any`
- Prefer named exports
- Avoid inline anonymous functions in JSX when possible
- Keep functions small and readable

---

## 🚫 Avoid

- God components
- Global feature state
- Large files with multiple responsibilities
- Cross-feature imports
- Business logic inside pages

---

## ✅ Copilot Should

- Generate small, composable components
- Follow vertical slice architecture
- Use reducers and context intentionally
- Apply memoization best practices
- Keep models, hooks, and utils inside feature folders

---
