---
applyTo: "src/**/*.tsx,src/**/*.ts"
---

# React Performance Instructions

Apply these performance rules to all React and TypeScript files.

## useMemo — Use It Correctly

**Generate `useMemo` only when:**
- Sorting, filtering, or grouping an array (O(n log n) or higher)
- The result is passed as a prop to a `React.memo`-wrapped child
- The computation is genuinely expensive

**Never generate `useMemo` for:**
- Simple arithmetic or string concatenation
- Object construction that isn't passed as a prop
- "Being safe" — unnecessary memoization adds overhead

```tsx
// Never generate this — trivial computation
const label = useMemo(() => `Hello, ${name}`, [name]);

// Do generate this — expensive sort on large array
const sortedItems = useMemo(
  () => [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [items]
);
```

## useCallback — Use It Correctly

**Generate `useCallback` only when:**
- The function is passed as a prop to a `React.memo`-wrapped child
- The function is listed as a dependency of another hook

**Never generate `useCallback` for:**
- Inline event handlers that are only used within the same component
- Functions not passed to any child or used in any dependency array

## useEffect — Strict Rules

`useEffect` is for **synchronizing with external systems** (subscriptions, DOM APIs, timers, WebSockets). It is not for:

- Deriving state from other state → compute inline or use `useMemo`
- Transforming data → compute during render
- Responding to events → use event handlers

```tsx
// Never generate this — effect deriving state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`); // extra state + extra render
}, [firstName, lastName]);

// Generate this instead
const fullName = `${firstName} ${lastName}`; // free, computed during render
```

**Always generate cleanup for effects that subscribe:**

```tsx
// Always include cleanup
useEffect(() => {
  const subscription = someService.subscribe(handler);
  return () => subscription.unsubscribe(); // required — memory leak without this
}, [handler]);
```

## List Keys

Never generate index-based keys on dynamic lists:

```tsx
// Never generate this
items.map((item, index) => <Item key={index} item={item} />);

// Always generate this
items.map(item => <Item key={item.id} item={item} />);
```

## Nested Maps — O(n²) Smell

Never generate nested `.map()` calls in JSX for large datasets. Pre-group data once outside the render:

```tsx
// Never generate this for large lists
{categories.map(cat => (
  <div key={cat.id}>
    {items.filter(i => i.categoryId === cat.id).map(i => <Row key={i.id} item={i} />)}
  </div>
))}

// Generate this instead — O(n) grouping done once
const itemsByCategory = useMemo(
  () => items.reduce((acc, item) => {
    (acc[item.categoryId] ??= []).push(item);
    return acc;
  }, {} as Record<string, typeof items>),
  [items]
);

{categories.map(cat => (
  <div key={cat.id}>
    {(itemsByCategory[cat.id] ?? []).map(i => <Row key={i.id} item={i} />)}
  </div>
))}
```

## Inline Object and Function Props

Never generate inline objects or functions passed as props — they create new references on every render:

```tsx
// Never generate this
<Component style={{ margin: 8 }} onClick={() => handleSelect(item.id)} />

// Generate this instead
const ITEM_STYLE = { margin: 8 } as const; // outside component
const handleItemSelect = useCallback(() => handleSelect(item.id), [item.id]);
<Component style={ITEM_STYLE} onClick={handleItemSelect} />
```

## Lazy Loading

Route-level page components should always be lazy-loaded:

```tsx
const BudgetPage = lazy(() => import('./features/budget/BudgetPage'));
```

## Context Performance

Never generate a single large context that holds unrelated state. Split by update frequency:

```tsx
// Never generate this
const AppContext = createContext({ user, theme, cart, filters, notifications });

// Generate separate contexts
const UserContext = createContext(user);
const ThemeContext = createContext(theme);
const CartContext = createContext(cart);
```
