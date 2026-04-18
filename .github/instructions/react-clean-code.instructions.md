---
applyTo: "src/**/*.tsx,src/**/*.ts"
---

# React Clean Code Instructions

Apply these rules to all React and TypeScript files in this project.

## Single Responsibility

Each component does ONE thing. If you can describe it with "and", it is doing too much. Split it.

Each file has ONE purpose: it is either a component, a hook, an API module, a model, a constants file, or a utils file — never a combination.

## File Size Limit

- **100–200 lines** — approaching the limit, consider splitting
- **200–300 lines** — this is a code smell, suggest splitting
- **300+ lines** — do not generate files this large; always split

When a file is too large, extract in this order:
1. Logic → custom hook (`useFeatureName.ts`)
2. Static data → constants (`featureName.constants.ts`)
3. Helper functions → utils (`featureName.utils.ts`)
4. Sub-components → their own file

## Props

- Always destructure props at the top of the component
- Always use a named `interface` for props — never inline types, never `any`
- Never spread all props blindly (`<Component {...props} />` hides the contract)
- Prop drilling more than 2 levels deep → suggest context or state management

## Conditional Rendering

Prefer early returns over ternary chains in JSX:

```tsx
// Always prefer this pattern
if (isLoading) return <Spinner />;
if (error) return <ErrorState error={error} />;
if (!data || data.length === 0) return <EmptyState />;
return <DataView data={data} />;
```

Never write nested ternaries inside JSX return statements.

## Constants and Magic Values

Never generate inline string or numeric literals that have domain meaning.

```tsx
// Never generate this
if (guests.length > 150) showWarning();

// Always generate this
import { MAX_GUEST_COUNT } from '../constants/guests.constants';
if (guests.length > MAX_GUEST_COUNT) showWarning();
```

## Async Data States

Every component that fetches data must handle all four states. Never generate a component that only handles the data state.

```tsx
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!items.length) return <EmptyState message="No items yet." />;
return <ItemList items={items} />;
```

## Dead Code

Never generate:
- Commented-out code blocks
- Unused imports
- Unreachable branches
- Variables that are declared but never read

## Comments

Only generate comments that explain business reasons (the "why"), not mechanics (the "what"). Code should be self-explanatory.
