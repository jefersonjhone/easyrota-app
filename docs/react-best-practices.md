# React Best Practices Guide

---

## Table of Contents

1. [Core Architecture Overview](#1-core-architecture-overview)
2. [Key Concepts for Beginners](#2-key-concepts-for-beginners)
   - [What is a Hook?](#what-is-a-hook)
   - [What is a `create*` function?](#what-is-a-create-function)
3. [Code Quality Fundamentals](#3-code-quality-fundamentals)
   - [Don't Hard-Code Constants](#dont-hard-code-constants)
   - [Don't Hard-Code Business Logic](#dont-hard-code-business-logic)
   - [Single Source of Truth](#single-source-of-truth)
   - [Single State](#single-state)
4. [Component Design](#4-component-design)
   - [Componentization & Reusability](#componentization--reusability)
   - [Customization via Props](#customization-via-props)
   - [Layout Separation](#layout-separation)
5. [HTML Semantics & Accessibility](#5-html-semantics--accessibility)
6. [Styling — Tailwind & Scoped CSS](#6-styling--tailwind--scoped-css)
7. [Hooks in Depth](#7-hooks-in-depth)
   - [useEffect — One Thing at a Time](#useeffect--one-thing-at-a-time)
   - [memo, useMemo, and useCallback](#memo-usememo-and-usecallback)
8. [URL as State](#8-url-as-state)
9. [Zustand — Client State Management](#9-zustand--client-state-management)
10. [Zod — Schema Validation](#10-zod--schema-validation)
11. [TanStack — The Swiss Army Knife](#11-tanstack--the-swiss-army-knife)
    - [TanStack Query](#tanstack-query-formerly-react-query)
    - [TanStack Router](#tanstack-router)
    - [TanStack Form](#tanstack-form)
12. [Providers (Global Infrastructure)](#12-providers-global-infrastructure)
13. [File-Based Routing](#13-file-based-routing-tanstack-router)
14. [Root & Nested Layouts](#14-root--nested-layouts)
15. [Authentication System](#15-authentication-system)
16. [Error Handling](#16-error-handling)
17. [API Layer](#17-api-layer)
18. [Subdomains](#18-subdomains)
19. [Performance & Tooling](#19-performance--tooling)
    - [React DevTools — Spotting Re-renders](#react-devtools--spotting-re-renders)
    - [Oxlint](#oxlint)
    - [Bun Built-in Features](#bun-built-in-features)
20. [Common Anti-Patterns](#20-common-anti-patterns)
21. [Best Practices Summary](#21-best-practices-summary)
22. [Mental Model](#22-mental-model)
23. [External References](#23-external-references)

---

## 1. Core Architecture Overview

The frontend is split into clearly separated layers. Think of it like floors in a building — each floor has a specific purpose and shouldn't do another floor's job.

```
src/
├── app/
│   ├── providers/        ← Global setup (query client, auth, theme)
│   ├── pages/            ← File-based routing (URL structure)
│   └── routes/           ← TanStack Router route tree
├── features/             ← Business logic grouped by domain
│   ├── auth/
│   ├── users/
│   └── admin/
└── shared/               ← Truly reusable utilities & components
    ├── components/
    ├── hooks/
    └── utils/
```

### Why this structure?

| Layer | Responsibility | Example |
|---|---|---|
| `providers/` | Wires up global dependencies once | `QueryClient`, `AuthProvider` |
| `pages/` | Maps URLs to components | `/dashboard` → `DashboardPage` |
| `features/` | Owns business logic per domain | `useLogin()`, `UserTable` |
| `shared/` | Pure reusable pieces | `Button`, `formatDate()` |

---

## 2. Key Concepts for Beginners

### What is a Hook?

A **hook** is a special React function that starts with `use`. Hooks let you "hook into" React features — like state, effects, context — **from inside a function component**.

> [!NOTE]
> 📖 Reference: [React Hooks Docs](https://react.dev/reference/react/hooks)

#### Built-in hooks

```tsx
import { useState, useEffect, useRef, useContext } from 'react'

// useState — local variable React can track
const [count, setCount] = useState(0)

// useEffect — run side effects (fetch data, subscriptions)
useEffect(() => {
  document.title = `Count: ${count}`
}, [count]) // runs whenever `count` changes

// useRef — hold a value that doesn't trigger re-renders
const inputRef = useRef<HTMLInputElement>(null)
```

#### Custom hooks — encapsulate reusable logic

A custom hook is just a function that uses other hooks internally. It's the primary way to share logic between components without copy-pasting.

```tsx
// ✅ A custom hook lives in a file like hooks/useWindowSize.ts
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler) // cleanup!
  }, [])

  return size
}

// Usage in any component
function MyComponent() {
  const { width, height } = useWindowSize()
  return <p>Window: {width} x {height}</p>
}
```

**Rules of Hooks** (enforced by ESLint):
- Only call hooks at the **top level** — never inside loops, conditions, or nested functions.
- Only call hooks from **React function components** or other custom hooks.

> [!IMPORTANT]
> 📖 Reference: [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

---

### What is a `create*` function?

`create*` functions are **factory functions** — they produce a configured instance of something once, which you then use throughout the app. You call them once (usually in a file like `store.ts` or `query-client.ts`), not inside components.

```ts
// create() from Zustand — produces a store
import { create } from 'zustand'
export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// new QueryClient() from TanStack Query — produces a cache
import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({ defaultOptions: { ... } })

// createRouter() from TanStack Router — produces the router
import { createRouter } from '@tanstack/react-router'
export const router = createRouter({ routeTree })
```

Think of them like **configuring a machine once** — you don't reconfigure the espresso machine every time you want coffee; you set it up once and use it.

---

## 3. Code Quality Fundamentals

These principles apply across your entire codebase, regardless of which libraries you use. Getting them right early prevents entire categories of bugs.

---

### Don't Hard-Code Constants

Avoid embedding raw values (magic numbers/strings) directly in your logic. Whenever a value has **meaning beyond the line of code** — limits, thresholds, defaults, pagination sizes, timeouts — give it a name.

Hard-coded values hide intent ("why 3?"), are error-prone to change (you'll miss one), can't be reused, and make code harder to read.

```tsx
// ❌ Anti-pattern — magic number
const TodoApp = () => {
  const [todos, setTodos] = useState([])
  return (todos.length > 3) ? <Pagination /> : <TodoList />
}
```

```tsx
// ✅ Named constant
const MAX_TODOS_PER_PAGE = 3

const TodoApp = () => {
  const [todos, setTodos] = useState([])
  return (todos.length > MAX_TODOS_PER_PAGE) ? <Pagination /> : <TodoList />
}
```

```tsx
// ✅ Even better — encode intent in a function
const MAX_TODOS_PER_PAGE = 3

const shouldPaginate = (todos: Todo[]) => todos.length > MAX_TODOS_PER_PAGE

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  return shouldPaginate(todos) ? <Pagination /> : <TodoList />
}
```

> [!TIP]
> Move from *"Is length greater than 3?"* to *"Should this list paginate?"* — that shift from raw value to named concept is what makes code understandable and maintainable.

---

### Don't Hard-Code Business Logic

Avoid embedding product rules (like free-tier limits) directly in components or constants. Whenever logic depends on **plans, subscriptions, pricing tiers, or feature flags**, centralize it in a domain layer.

Hard-coding business rules couples UI to pricing decisions, makes changes risky and scattered, and breaks the moment you introduce multiple plans.

```tsx
// ❌ Anti-pattern — product decision buried in UI code
const MAX_FREE_TODOS = 3

const hasReachedFreeTodosTier = (todos: Todo[]) => todos.length >= MAX_FREE_TODOS

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  return hasReachedFreeTodosTier(todos) ? <UpgradePrompt /> : <TodoList />
}
```

```tsx
// ✅ Centralize business logic in a domain layer
// domain/plan.ts
export const createPlan = (type: 'free' | 'pro' | 'team') => {
  const limits = {
    free: { maxTodos: 3 },
    pro:  { maxTodos: 50 },
    team: { maxTodos: Infinity },
  }

  const { maxTodos } = limits[type]

  return {
    hasReachedTodoLimit: (todos: Todo[]) => todos.length >= maxTodos,
    canCreateTodo:       (todos: Todo[]) => todos.length < maxTodos,
  }
}
```

```tsx
// Usage — reads like product intent
const plan = useUserPlan(user)

if (!plan.canCreateTodo(todos)) return <UpgradePrompt />
```

> [!TIP]
> Move from *"Do we have more than 3 todos?"* to *"Is this user allowed to create more todos?"* — that shift from technical constraint to business capability keeps your codebase flexible as your product evolves.

---

### Single Source of Truth

Each piece of data should live in **one place only**. When the same data exists in multiple states, they go out of sync and create hard-to-track bugs.

```tsx
// ❌ Anti-pattern — duplicated state
const [todos, setTodos] = useState<Todo[]>([])
const [completedTodos, setCompletedTodos] = useState<Todo[]>([])
// Which one is authoritative? They can drift apart.
```

```tsx
// ✅ One source, everything else derived
const [todos, setTodos] = useState<Todo[]>([])

const completedTodos = todos.filter((t) => t.completed)
```

> [!TIP]
> 🔑 **Key rule:** If a value can be computed from existing state, don't store it separately — derive it.

---

### Single State

Group related state into a **single structure** instead of scattering it across multiple `useState` calls. When multiple pieces of state always change together, they belong together.

```tsx
// ❌ Anti-pattern — scattered state
const [firstName, setFirstName] = useState('')
const [lastName, setLastName]   = useState('')
const [email, setEmail]         = useState('')
```

```tsx
// ✅ Grouped state
const [form, setForm] = useState({
  firstName: '',
  lastName:  '',
  email:     '',
})

const updateField = (field: keyof typeof form, value: string) => {
  setForm((prev) => ({ ...prev, [field]: value }))
}
```

> [!NOTE]
> This applies to local state. For more complex cross-component state, see [Zustand](#9-zustand--client-state-management). For form state specifically, see [TanStack Form](#tanstack-form).

---

## 4. Component Design

Good components do one thing well, express intent clearly, and are easy to compose. This section covers how to think about breaking UI into pieces.

---

### Componentization & Reusability

Break UI into small, focused, reusable components instead of repeating markup. When you see duplicated JSX, that's your signal to extract a component.

```tsx
// ❌ Anti-pattern — repeated markup
const Navbar = () => (
  <nav>
    <a href="/components">
      <button className="bg-primary cursor-pointer border border-white">Components</button>
    </a>
    <a href="/pricing">
      <button className="bg-primary cursor-pointer border border-white">Pricing</button>
    </a>
    <a href="/team">
      <button className="bg-primary cursor-pointer border border-white">Our Team</button>
    </a>
  </nav>
)
```

```tsx
// ✅ Extract into a reusable component
type NavLinkProps = { to: string; children: React.ReactNode }

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => (
  <Link to={to} className="bg-primary cursor-pointer border border-white px-3 py-1">
    {children}
  </Link>
)

const Navbar = () => (
  <nav>
    <NavLink to="/components">Components</NavLink>
    <NavLink to="/pricing">Pricing</NavLink>
    <NavLink to="/team">Our Team</NavLink>
  </nav>
)
```

```tsx
// ✅ Even better — data-driven rendering
const navigation = [
  { to: '/components', label: 'Components' },
  { to: '/pricing',    label: 'Pricing' },
  { to: '/team',       label: 'Our Team' },
]

const Navbar = () => (
  <nav>
    {navigation.map((link) => (
      <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
    ))}
  </nav>
)
```

#### Semantics through components

Use components to express *intent*, not just structure. This makes your JSX scan like a description of the UI, not a pile of divs.

```tsx
// ❌ Anti-pattern — div soup
const Page = () => (
  <div className="p-4 border rounded">
    <div className="text-xl font-bold">Welcome</div>
    <div className="text-sm text-gray-500">Manage your todos easily</div>
  </div>
)
```

```tsx
// ✅ Components that describe meaning
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <section className="p-4 border rounded">{children}</section>
)

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className="text-xl font-bold">{children}</h1>
)

const Subtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
)

const Page = () => (
  <Card>
    <Title>Welcome</Title>
    <Subtitle>Manage your todos easily</Subtitle>
  </Card>
)
```

> [!TIP]
> Move from *"How is this UI built?"* to *"What does this UI represent?"* — that shift from structure to intent is what makes components truly powerful.

---

### Customization via Props

Make components flexible through props instead of duplicating variations. A single component with a `variant` prop scales infinitely better than five nearly-identical components.

```tsx
// ❌ Anti-pattern — duplicated structure
const PrimaryButton = ({ children }) => (
  <button className="bg-blue-500 text-white px-4 py-2">{children}</button>
)

const DangerButton = ({ children }) => (
  <button className="bg-red-500 text-white px-4 py-2">{children}</button>
)
```

```tsx
// ✅ Single component, configurable via props
type ButtonProps = {
  variant?: 'primary' | 'danger'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children }) => {
  const styles = {
    primary: 'bg-blue-500 text-white',
    danger:  'bg-red-500 text-white',
  }

  return (
    <button className={`${styles[variant]} px-4 py-2`}>
      {children}
    </button>
  )
}

// Usage
<Button>Save</Button>
<Button variant="danger">Delete</Button>
```

> [!NOTE]
> 📖 Reference: [React — Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)

---

### Layout Separation

Avoid embedding **layout-related styles** (margin, positioning, spacing between siblings) inside reusable components. A component should describe *what it looks like*, not *where it sits*. Let the parent control layout.

```tsx
// ❌ Anti-pattern — layout inside the component
const Title = ({ children }) => (
  <h1 className="text-center text-xl mb-10"> {/* mb-10 is layout, not identity */}
    {children}
  </h1>
)
```

```tsx
// ✅ Component owns its intrinsic style; parent owns layout
const Title = ({ children }) => (
  <h1 className="text-center text-xl">{children}</h1>
)

const Article = () => (
  <article className="space-y-4"> {/* parent controls spacing */}
    <Title>My first post</Title>
    <p>Lorem ipsum...</p>
  </article>
)
```

> [!TIP]
> Rule of thumb: padding, color, typography → the component. Margin, position, gap → the parent.

---

## 5. HTML Semantics & Accessibility

Using the right HTML elements isn't just cosmetic — it determines how screen readers navigate your app, how search engines index it, and how keyboard users interact with it. Always prefer **native HTML semantics first**, and fall back to generic elements (`div`, `span`) only when necessary.

> [!IMPORTANT]
> 📖 References: [MDN — HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element) · [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/) · [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)

### Use the right element

```tsx
// ❌ Anti-pattern — "div this, div that"
<div className="header">
  <div className="title">Dashboard</div>
  <div className="nav">
    <div onClick={...}>Home</div>
    <div onClick={...}>Settings</div>
  </div>
</div>
```

```tsx
// ✅ Proper semantic structure
<header>
  <h1>Dashboard</h1>
  <nav>
    <button>Home</button>
    <button>Settings</button>
  </nav>
</header>
```

### Avoid unnecessary nesting

```tsx
// ❌ Anti-pattern — meaningless wrapping
<div>
  <div>
    <span>
      <p>Welcome to the app</p>
    </span>
  </div>
</div>

// ✅ Just the element that carries meaning
<p>Welcome to the app</p>
```

### SEO — headings convey hierarchy

```tsx
// ❌ Anti-pattern — search engines can't understand this
<div className="title">My Blog Post</div>
<div className="subtitle">A great subtitle</div>

// ✅ Heading hierarchy tells crawlers what matters
<article>
  <h1>My Blog Post</h1>
  <h2>A great subtitle</h2>
</article>
```

### Accessibility — contrast and font size

```tsx
// ❌ Anti-pattern — unreadable for many users
<p style={{ color: '#ccc', fontSize: '10px' }}>Important information</p>

// ✅ Sufficient contrast and readable sizing
<p className="text-base text-gray-800">Important information</p>
```

**Guidelines:**
- Ensure sufficient color contrast (minimum 4.5:1 for normal text, per WCAG AA)
- Use readable font sizes (16px baseline)
- Don't rely on color alone — errors should include icons or text, not just a red highlight

### ARIA — only when native HTML isn't enough

ARIA attributes extend HTML semantics for complex interactive widgets. Don't use ARIA to reinvent what a native element already does.

```tsx
// ❌ Anti-pattern — reinventing a button
<div role="button" onClick={handleClick}>Submit</div>
// Missing keyboard support, focus management, etc.

// ✅ Just use a button
<button onClick={handleClick}>Submit</button>
```

```tsx
// ✅ ARIA is appropriate here — native HTML has no equivalent
<button aria-expanded={isOpen} onClick={toggle}>Toggle menu</button>

<nav aria-label="Main navigation">...</nav>
```

> [!TIP]
> 📖 Reference: [MDN — ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) · [The A11Y Project](https://www.a11yproject.com/)

---

## 6. Styling — Tailwind & Scoped CSS

Use utility-first classes (via **Tailwind CSS**) to style components directly in markup — it eliminates most custom CSS, keeps styles close to components, and encourages consistency through design tokens. That said, Tailwind is not a replacement for all CSS.

> [!NOTE]
> 📖 Reference: [Tailwind CSS Docs](https://tailwindcss.com/docs) · [Tailwind CSS — YouTube channel](https://www.youtube.com/@TailwindLabs)

### Use Tailwind for common layouts

```tsx
// ❌ Anti-pattern — context switching to a separate stylesheet for simple styles
// styles.css
.card { padding: 16px; border: 1px solid #ddd; border-radius: 8px; }

<div className="card">Content</div>

// ✅ Tailwind keeps it collocated
<div className="p-4 border rounded-lg">Content</div>
```

### Don't let class lists become unreadable

If your element has 20 utility classes, that's a sign you should extract a component.

```tsx
// ❌ Anti-pattern — unreadable class soup
<div className="p-4 pt-6 pb-2 pl-3 pr-3 border border-gray-200 rounded-lg flex flex-row items-center justify-between gap-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 ease-in-out">
  Content
</div>

// ✅ Extract into a named component
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border rounded-lg bg-white">{children}</div>
)
```

### When to use scoped CSS

Use **CSS Modules** or **styled-components** for styles that are too complex for utilities, need encapsulation, or represent a component's core identity.

```tsx
// ❌ Anti-pattern — forcing Tailwind on complex pseudo-element animations
<div className="relative before:content-[''] before:absolute before:w-full before:h-1 before:bg-blue-500 before:bottom-0 before:left-0 hover:before:h-2 transition-all duration-300">
  Button
</div>
```

```css
/* Button.module.css — much clearer */
.button { position: relative; }

.button::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 4px;
  background: blue;
  bottom: 0; left: 0;
  transition: all 0.3s;
}

.button:hover::before { height: 8px; }
```

```tsx
import styles from './Button.module.css'

const Button = () => <div className={styles.button}>Button</div>
```

### Hybrid approach (recommended)

Use both tools for what each does best:

```tsx
import styles from './Card.module.css'

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className={`p-4 rounded-lg shadow ${styles.card}`}>
    {children}
  </div>
)
```

| Use case | Tool |
|---|---|
| Layout, spacing, colors, typography | Tailwind |
| Complex animations, pseudo-elements | Scoped CSS |
| Third-party overrides | Scoped CSS |
| Reusable design components | Either + abstraction |

> [!TIP]
> Don't turn this into a religion. Ask: *"What's the simplest, most readable way to express this style?"*

---

## 7. Hooks in Depth

### useEffect — One Thing at a Time

Each `useEffect` should handle **a single side effect**. Mixing multiple concerns in one effect makes dependencies confusing, causes unintended re-runs, and is harder to debug.

```tsx
// ❌ Anti-pattern — three unrelated things in one effect
useEffect(() => {
  fetchTodos(user.id).then(setTodos)

  const interval = setInterval(() => {
    console.log('tick')
  }, 1000)

  document.title = 'Todos'

  return () => clearInterval(interval)
}, [user.id])
```

```tsx
// ✅ One effect, one responsibility
useEffect(() => {
  fetchTodos(user.id).then(setTodos)
}, [user.id])

useEffect(() => {
  const interval = setInterval(() => console.log('tick'), 1000)
  return () => clearInterval(interval)
}, [])

useEffect(() => {
  document.title = 'Todos'
}, [])
```

> [!WARNING]
> Always return a cleanup function from effects that create timers, subscriptions, or event listeners — otherwise you'll have memory leaks.
>
> ```tsx
> // ❌ Memory leak
> useEffect(() => {
>   const interval = setInterval(fetchData, 5000)
>   // No cleanup!
> }, [])
>
> // ✅ Clean up on unmount
> useEffect(() => {
>   const interval = setInterval(fetchData, 5000)
>   return () => clearInterval(interval)
> }, [])
> ```

> [!NOTE]
> 📖 Reference: [React — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) · [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

### memo, useMemo, and useCallback

Use memoization to **avoid unnecessary recalculations or re-renders** — but only when you have a measured reason to. Overusing it adds complexity and can actually make performance worse.

```tsx
// ❌ Anti-pattern — memoizing trivial values
const value = useMemo(() => count + 1, [count])
const handleClick = useCallback(() => setCount(count + 1), [count])
// This adds overhead with no real gain
```

```tsx
// ✅ useMemo — expensive computation
const filteredTodos = useMemo(() => {
  return todos.filter((t) => t.completed)
}, [todos])

// ✅ useCallback — stable reference for a memoized child
const handleSelect = useCallback((id: string) => {
  setSelected(id)
}, [])

// ✅ React.memo — skip re-rendering when props haven't changed
const Item = React.memo(({ todo, onClick }: ItemProps) => (
  <li onClick={() => onClick(todo.id)}>{todo.title}</li>
))

const List = ({ todos }: { todos: Todo[] }) => {
  const handleClick = useCallback((id: string) => {
    console.log(id)
  }, [])

  return (
    <ul>
      {todos.map((todo) => (
        <Item key={todo.id} todo={todo} onClick={handleClick} />
      ))}
    </ul>
  )
}
```

> [!TIP]
> Profile first with React DevTools before reaching for memoization. Most apps don't need it until they do — and you'll know when.

> [!NOTE]
> 📖 Reference: [React — useMemo](https://react.dev/reference/react/useMemo) · [React — useCallback](https://react.dev/reference/react/useCallback)

---

## 8. URL as State

Store **UI state in the URL** when it represents navigation or shareable state — filters, search queries, pagination, active tabs, sort order. Keeping this state only in memory breaks the back button, prevents sharing links, and creates inconsistent UX.

```tsx
// ❌ Anti-pattern — filter state lives only in memory
const [filter, setFilter] = useState('all')
// Refresh the page → filter resets. Can't share this URL.
```

```tsx
// ✅ URL is the source of truth
const [searchParams, setSearchParams] = useSearchParams()

const filter = searchParams.get('filter') ?? 'all'

const setFilter = (value: string) => {
  setSearchParams({ filter: value })
}
// Now /todos?filter=completed is a real, shareable URL
```

With TanStack Router, search params are fully typed:

```tsx
// routes/todos.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  filter: z.enum(['all', 'active', 'completed']).default('all'),
  page:   z.number().default(1),
})

export const Route = createFileRoute('/todos')({
  validateSearch: searchSchema,
  component: TodosPage,
})

function TodosPage() {
  const { filter, page } = Route.useSearch() // fully typed
  // ...
}
```

> [!NOTE]
> 📖 Reference: [TanStack Router — Search Params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)

---

## 9. Zustand — Client State Management

**What it is:** A minimal, fast state management library for React. Think of it as a global `useState` that any component can access — without the complexity of Redux.

> [!NOTE]
> 📖 Reference: [Zustand Docs](https://zustand.docs.pmnd.rs) · [Zustand — Getting Started (YouTube)](https://www.youtube.com/watch?v=_ngCLZ5Iz-0)

**What it solves:** Sharing state between components that aren't parent-child related, without prop drilling or complex Context boilerplate.

### When to use Zustand vs TanStack Query

| State Type | Use | Example |
|---|---|---|
| Server data (from API) | TanStack Query | List of users, a product |
| Client UI state | Zustand | Sidebar open/closed, current theme |
| Auth session | Zustand | Logged-in user object |
| Form data | TanStack Form | Input values during editing |

> [!IMPORTANT]
> 🔑 **Key rule:** If the data lives on a server, use TanStack Query. If it only exists in the browser session, use Zustand.

### Basic store

```ts
// features/auth/store.ts
import { create } from 'zustand'

type User = {
  id: string
  role: 'user' | 'admin'
  name: string
}

type AuthState = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

### Encapsulate behavior inside the store

Keep logic in the store — not scattered across components. Components should stay declarative.

```tsx
// ❌ Anti-pattern — logic leaking into the component
const count = useStore((s) => s.count)
const setCount = useStore((s) => s.setCount)

<button onClick={() => setCount(count + 1)}>+</button>
```

```tsx
// ✅ Logic lives in the store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

const increment = useStore((s) => s.increment)

<button onClick={increment}>+</button>
```

### Using a store in components

```tsx
// Only re-renders when `user` changes — not the whole store
function Header() {
  const user   = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <header>
      {user ? (
        <>
          <span>Hello, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  )
}
```

### Grouping related state

```tsx
// ❌ Anti-pattern — scattered global state
const [count, setCount] = useState(0)
const [theme, setTheme] = useState('light')
const [user, setUser]   = useState(null)

// ✅ One coherent store
const useStore = create((set) => ({
  count: 0,
  theme: 'light',
  user:  null,
  setCount: (count) => set({ count }),
  setTheme: (theme) => set({ theme }),
  setUser:  (user)  => set({ user }),
}))
```

### Persisting state (localStorage)

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeState = {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'theme-storage' } // key in localStorage
  )
)
```

---

## 10. Zod — Schema Validation

**What it is:** A TypeScript-first schema declaration and validation library. You define the shape and rules of your data once, and Zod gives you both runtime validation **and** TypeScript types for free.

> [!NOTE]
> 📖 Reference: [Zod Docs](https://zod.dev) · [Total TypeScript — Zod Tutorial](https://www.youtube.com/watch?v=L6BE-U3oy80)

**What it solves:**
- Validating API responses so bad data doesn't crash your app
- Validating form inputs before submission
- Generating TypeScript types from your validation schemas (DRY)
- Runtime type checking (TypeScript alone only checks at compile time)

```ts
import { z } from 'zod'

// Define a schema
const UserSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(1, 'Name is required'),
  email:     z.string().email('Must be a valid email'),
  age:       z.number().min(18, 'Must be 18 or older').optional(),
  role:      z.enum(['user', 'admin']),
  createdAt: z.string().datetime(),
})

// Infer the TypeScript type — no duplication!
type User = z.infer<typeof UserSchema>
// type User = { id: string; name: string; email: string; age?: number; role: 'user' | 'admin'; createdAt: string }

// Parse (throws on failure)
const user = UserSchema.parse(apiResponse)

// Safe parse (returns { success, data } or { success, error })
const result = UserSchema.safeParse(apiResponse)
if (result.success) {
  console.log(result.data.email) // fully typed
} else {
  console.error(result.error.flatten())
}
```

#### Zod in API responses

```ts
async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  const raw = await res.json()

  // Validate the response shape — if the API changes, you'll know immediately
  return UserSchema.parse(raw)
}
```

#### Common Zod patterns

```ts
// Optional vs nullable
z.string().optional()     // string | undefined
z.string().nullable()     // string | null
z.string().nullish()      // string | null | undefined

// Arrays
z.array(UserSchema)               // User[]
z.array(z.string()).min(1)        // non-empty string array

// Union types
z.union([z.string(), z.number()])

// Transform (parse then transform)
z.string().transform((val) => val.trim().toLowerCase())

// Refinement (custom validation)
z.string().refine((val) => val.includes('@'), { message: 'Must contain @' })
```

---

## 11. TanStack — The Swiss Army Knife

[TanStack](https://tanstack.com) is a collection of open-source libraries by [Tanner Linsley](https://github.com/tannerlinsley) that solve some of the hardest frontend problems in a type-safe, framework-agnostic way. They work with React, Vue, Solid, Svelte, and Angular.

> [!NOTE]
> 📖 Reference: [TanStack Homepage](https://tanstack.com) · [TanStack — YouTube](https://www.youtube.com/@tanstack)

---

### TanStack Query (formerly React Query)

**What it solves:** Managing **server state** — data that lives on a server and needs to be fetched, cached, synced, and updated.

Without TanStack Query, you'd manually write `useEffect` + `useState` + loading/error flags for every API call. TanStack Query replaces all of that.

> [!NOTE]
> 📖 Reference: [TanStack Query Docs](https://tanstack.com/query/latest) · [React Query in 100 Seconds](https://www.youtube.com/watch?v=novnyCaa7To)

#### What problems it specifically solves

| Problem | Without Query | With TanStack Query |
|---|---|---|
| Fetching data | Manual `useEffect` + `useState` | `useQuery` hook |
| Caching responses | DIY or re-fetch every time | Automatic, configurable |
| Background refresh | Complex intervals | `staleTime`, `refetchInterval` |
| Loading/error state | Boilerplate flags | Built-in `isLoading`, `isError` |
| Mutations (POST/PUT/DELETE) | Manual fetch + state update | `useMutation` |
| Optimistic updates | Very hard | Built-in pattern |
| Pagination / infinite scroll | Complex state | `useInfiniteQuery` |

#### Setup

```ts
// app/providers/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // retry failed requests once
      staleTime: 1000 * 60 * 5,   // data is "fresh" for 5 minutes
      refetchOnWindowFocus: false, // don't refetch when tab is re-focused
    },
  },
})
```

```tsx
// app/providers/index.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './query-client'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools panel — only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

#### Fetching data — `useQuery`

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/utils/api'

type User = { id: string; name: string; email: string }

// Define a query key — this is the cache identifier
// Think of it like a unique name tag for this piece of data
const userKeys = {
  all:    ['users'] as const,
  detail: (id: string) => ['users', id] as const,
}

function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn:  () => api<User[]>('/api/users'),
  })
}

// Usage in a component
function UserList() {
  const { data, isLoading, isError, error } = useUsers()

  if (isLoading) return <p>Loading...</p>
  if (isError)   return <p>Error: {error.message}</p>

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

#### Mutating data — `useMutation`

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newUser: { name: string; email: string }) =>
      api<User>('/api/users', { method: 'POST', body: JSON.stringify(newUser) }),

    onSuccess: () => {
      // Invalidate the users list so it refetches
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

function CreateUserForm() {
  const { mutate, isPending } = useCreateUser()

  return (
    <button
      onClick={() => mutate({ name: 'Alice', email: 'alice@example.com' })}
      disabled={isPending}
    >
      {isPending ? 'Creating...' : 'Create User'}
    </button>
  )
}
```

---

### TanStack Router

**What it solves:** Type-safe, file-based routing for React apps. Every route, param, and search param is fully typed — no more `params.id` being `string | undefined` without knowing why.

> [!NOTE]
> 📖 Reference: [TanStack Router Docs](https://tanstack.com/router/latest)

#### What it solves vs React Router

| Feature | React Router | TanStack Router |
|---|---|---|
| Type-safe params | ❌ | ✅ |
| Type-safe search params | ❌ | ✅ |
| File-based routing | Plugin needed | Built-in |
| Data loaders (before render) | ✅ | ✅ |
| Devtools | ❌ | ✅ |

#### File structure

```
routes/
  __root.tsx            ← Root layout (wraps everything)
  index.tsx             ← Matches /
  login.tsx             ← Matches /login
  dashboard.tsx         ← Matches /dashboard (layout)
  dashboard.users.tsx   ← Matches /dashboard/users
  dashboard.settings.tsx
  $.tsx                 ← Catch-all (404)
```

---

### React Hook Form

**What it solves:** Performant, minimal-boilerplate forms using uncontrolled inputs and refs. Avoids re-rendering the entire form on each keystroke while keeping validation simple and type-safe.

> 📖 Reference: [https://react-hook-form.com](https://react-hook-form.com)

---

#### Why not just use controlled inputs?

With `useState` per field, every change triggers a component re-render. In larger forms, this becomes inefficient. React Hook Form stores input state internally using refs and only updates what’s necessary.

---

#### Example with Zod

```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Infer TypeScript type from schema
type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  const onSubmit = (data: LoginFormData) => {
    console.log('Submitting:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} placeholder="doe@example.com"/>
        {errors.email && (
          <span>{errors.email.message}</span>
        )}
      </div>
      <div>
        <input type="password" {...register('password')} placeholder="Password"/>
        {errors.password && (
          <span>{errors.password.message}</span>
        )}
      </div>
      <button type="submit">Login</button>
    </form>
  )
}
```

---

#### Key Advantages

* **No unnecessary re-renders** (uncontrolled inputs)
* **Minimal boilerplate** compared to controlled forms
* **Built-in validation support** via resolvers (Zod, Yup, etc.)
* **Strong TypeScript support** with schema inference
* **Simple API** (`register`, `handleSubmit`, `errors`)

---

#### Optional: Cleaner Field Pattern

If you want slightly more structure without heavy abstraction:

```tsx
<Field>
  <FieldLabel>Email</FieldLabel>
  <Input {...register('email')}>
  <HintInvalid for={errors.email}>
</Field>
```

---

## 12. Providers (Global Infrastructure)

Providers are React components that inject **global dependencies** into the app tree using React Context under the hood.

They exist to avoid:
- **Prop drilling** — passing the same prop through 5 layers of components
- **Re-initializing services** — creating a new QueryClient on every render
- **Tight coupling** — components reaching out to global singletons directly

```tsx
// app/providers/index.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './query-client'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Add more providers here, wrapping inward */}
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

```tsx
// main.tsx
import { AppProviders } from './app/providers'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>
)
```

### Optional providers (commonly added)

```tsx
// AuthProvider — initializes session from cookie/localStorage on load
// ThemeProvider — syncs theme from Zustand to CSS variables
// ToastProvider — global notifications (e.g., react-hot-toast)
// FeatureFlagProvider — toggles features per environment or user
```

---

## 13. File-Based Routing (TanStack Router)

Instead of manually configuring routes in a big array, each file in `routes/` **automatically becomes a route**. The filename dictates the URL.

> [!NOTE]
> 📖 Reference: [TanStack Router — File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)

### Naming convention

| File | URL |
|---|---|
| `routes/index.tsx` | `/` |
| `routes/login.tsx` | `/login` |
| `routes/dashboard.tsx` | `/dashboard` (layout) |
| `routes/dashboard.users.tsx` | `/dashboard/users` |
| `routes/dashboard.users.$id.tsx` | `/dashboard/users/:id` |
| `routes/$.tsx` | any unmatched URL (404) |
| `routes/__root.tsx` | Root layout (wraps all routes) |

### Route with data loading

```tsx
// routes/dashboard.users.$id.tsx
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/shared/utils/api'

export const Route = createFileRoute('/dashboard/users/$id')({
  // Loader runs BEFORE the component renders
  loader: ({ params }) => api(`/api/users/${params.id}`),

  component: UserDetailPage,
})

function UserDetailPage() {
  // Data is already available — no loading state needed!
  const user = Route.useLoaderData()
  const { id } = Route.useParams() // fully typed

  return <h1>{user.name}</h1>
}
```

---

## 14. Root & Nested Layouts

### Root Layout (`routes/__root.tsx`)

The root layout wraps **every single page** in your app. It's the app shell.

```tsx
// routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: GlobalErrorBoundary,
})

function RootLayout() {
  return (
    <div>
      <header>Global Header</header>
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
      <footer>Footer</footer>
      <TanStackRouterDevtools />
    </div>
  )
}

function GlobalErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
    </div>
  )
}
```

**Root layout should contain:**
- App shell (header/footer/nav)
- Global modals and toast containers
- Theme wrappers

**Root layout should NOT contain:**
- API calls or data fetching
- Business logic
- Feature-specific UI
- Auth checks (except global redirect fallback)

### Nested Layout (e.g., Dashboard)

```tsx
// routes/dashboard.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <aside>
        <nav>
          <a href="/dashboard/users">Users</a>
          <a href="/dashboard/settings">Settings</a>
        </nav>
      </aside>
      <section>
        <Outlet /> {/* Nested pages render here */}
      </section>
    </div>
  )
}
```

```
URL: /dashboard/users
Renders: RootLayout → DashboardLayout → UsersPage
```

---

## 15. Authentication System

### User model

```ts
// features/auth/types.ts
export type UserRole = 'user' | 'admin'

export type User = {
  id:    string
  name:  string
  email: string
  role:  UserRole
}
```

### Auth store (Zustand)

```ts
// features/auth/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from './types'

type AuthState = {
  user:     User | null
  token:    string | null
  setUser:  (user: User | null) => void
  setToken: (token: string | null) => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:     null,
      token:    null,
      setUser:  (user)  => set({ user }),
      setToken: (token) => set({ token }),
      logout:   ()      => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

### Protected route component

```tsx
// features/auth/components/Protected.tsx
import { Navigate } from '@tanstack/react-router'
import { useAuthStore } from '../store'

export function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'admin') return <Navigate to="/" />
  return <>{children}</>
}
```

### Using guards in routes

```tsx
// routes/dashboard.admin.tsx
export default function AdminPage() {
  return (
    <AdminOnly>
      <div>Admin Panel</div>
    </AdminOnly>
  )
}
```

### Auth with TanStack Router (`beforeLoad`)

A more integrated approach using the router's `beforeLoad` hook — auth is checked before anything renders:

```tsx
// routes/dashboard.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayout,
})
```

> [!TIP]
> Prefer `beforeLoad` for auth guards over component-level checks. It runs before the route even renders, giving you a cleaner, more predictable flow.

---

## 16. Error Handling

### 404 Not Found

```tsx
// routes/$.tsx  ← Catches any unmatched URL
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFound,
})

function NotFound() {
  return (
    <div>
      <h1>404 — Page not found</h1>
      <a href="/">Go home</a>
    </div>
  )
}
```

### Route-level error boundary

Each route can have its own error handler, so a broken page doesn't crash the entire app:

```tsx
export const Route = createFileRoute('/dashboard/users')({
  loader: () => api('/api/users'),
  errorComponent: ({ error }) => (
    <div>
      <h2>Failed to load users</h2>
      <p>{error.message}</p>
    </div>
  ),
  component: UsersPage,
})
```

### Server errors (from API)

```ts
// shared/utils/api.ts
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (res.status === 401) throw new Error('Unauthorized')
  if (res.status === 403) throw new Error('Forbidden')
  if (res.status === 404) throw new Error('Not found')
  if (!res.ok) throw new Error(await res.text())

  return res.json()
}
```

---

## 17. API Layer

### Native fetch wrapper (no Axios needed)

```ts
// shared/utils/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function api<T>(
  url: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...fetchOptions } = options ?? {}

  const fullUrl = new URL(`${BASE_URL}${url}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => fullUrl.searchParams.set(k, v))
  }

  const token = useAuthStore.getState().token

  const res = await fetch(fullUrl.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  })

  if (!res.ok) throw new Error(await res.text())

  return res.json()
}
```

### Feature-level API functions

Group API calls by feature, not by HTTP method:

```ts
// features/users/api.ts
import { api } from '@/shared/utils/api'
import type { User } from './types'

export const usersApi = {
  list:   ()                         => api<User[]>('/api/users'),
  detail: (id: string)               => api<User>(`/api/users/${id}`),
  create: (body: Omit<User, 'id'>)   => api<User>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<User>) => api<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string)               => api<void>(`/api/users/${id}`, { method: 'DELETE' }),
}
```

---

## 18. Subdomains

Subdomains allow completely separate app experiences under one backend.

```
app.myproduct.com    → Customer-facing app
admin.myproduct.com  → Admin panel
api.myproduct.com    → Backend API
```

### Detecting the current subdomain

```ts
// shared/utils/subdomain.ts
export type Subdomain = 'app' | 'admin' | 'unknown'

export function getSubdomain(): Subdomain {
  const host = window.location.hostname

  if (host === 'localhost' || host === '127.0.0.1') return 'app'

  const parts = host.split('.')
  if (parts.length > 2) {
    const sub = parts[0]
    if (sub === 'admin') return 'admin'
    if (sub === 'app')   return 'app'
  }

  return 'unknown'
}
```

### Subdomain guard component

```tsx
export function SubdomainGuard({ children }: { children: React.ReactNode }) {
  const subdomain = getSubdomain()

  if (subdomain === 'admin') {
    return <AdminOnly>{children}</AdminOnly>
  }

  return <>{children}</>
}
```

### Local development setup

Add to `/etc/hosts`:

```
127.0.0.1 app.localhost
127.0.0.1 admin.localhost
```

Then visit:
- http://app.localhost:5173
- http://admin.localhost:5173

---

## 19. Performance & Tooling

### React DevTools — Spotting Re-renders

React performance problems are often invisible — a component silently re-rendering 50 times on a single action, or an expensive calculation running on every keystroke. **React DevTools Profiler** lets you see exactly what React is doing.

> [!NOTE]
> 📖 Reference: [React DevTools](https://react.dev/learn/react-developer-tools) · [React DevTools Profiler — YouTube](https://www.youtube.com/watch?v=00RoZflFE34)

**Common re-render culprit — inline functions as props:**

```tsx
// ❌ Anti-pattern — new function on every render → child always re-renders
const List = ({ todos }: { todos: Todo[] }) => {
  return todos.map((todo) => (
    <Item
      key={todo.id}
      todo={todo}
      onClick={() => console.log(todo.id)} // new reference each render
    />
  ))
}
```

```tsx
// ✅ Stable reference with useCallback
const List = ({ todos }: { todos: Todo[] }) => {
  const handleClick = useCallback((id: string) => {
    console.log(id)
  }, [])

  return todos.map((todo) => (
    <Item key={todo.id} todo={todo} onClick={handleClick} />
  ))
}
```

> [!TIP]
> Open the **Profiler** tab in React DevTools, hit Record, interact with your app, then stop. Look for components with frequent or unexpected renders and trace back why they're receiving new props.

---

### Oxlint

A fast linter from the [Oxc](https://oxc.rs) ecosystem that catches **bugs, bad patterns, and style issues** — much faster than ESLint. Use it in every project, in CI and locally.

> [!NOTE]
> 📖 Reference: [Oxlint Docs](https://oxc.rs/docs/guide/usage/linter.html) · [Oxc GitHub](https://github.com/oxc-project/oxc)

Linters catch common mistakes early, keep codebases consistent, and reduce review overhead.

```tsx
// ❌ Anti-pattern — side effect in render body (Oxlint catches this)
const Component = () => {
  const data = fetchData() // calling an async function directly in render
  return <div>{data}</div>
}
```

```tsx
// ✅ Side effects belong in useEffect or TanStack Query
const Component = () => {
  const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData })
  return <div>{data}</div>
}
```

---

### Bun Built-in Features

[Bun](https://bun.sh) is a fast JavaScript runtime that includes a test runner, bundler, and package manager out of the box. Starting new projects with Bun reduces dependencies, improves performance, and simplifies your toolchain.

> [!NOTE]
> 📖 Reference: [Bun Docs](https://bun.sh/docs) · [Bun in 100 Seconds](https://www.youtube.com/watch?v=U4JVw8K19uY)

```bash
# ❌ Heavy toolchain
npm install jest webpack esbuild axios

# ✅ Bun includes it all
bun test     # test runner
bun build    # bundler
bun install  # package manager (fast)
```

```tsx
// ✅ Native fetch — no axios needed
const data = await fetch('/api/todos').then((r) => r.json())
```

---

## 20. Common Anti-Patterns

These are mistakes that seem fine at first but cause bugs, performance issues, or unmaintainable code over time.

---

### ❌ Fetching data in `useEffect` manually

```tsx
// ❌ Anti-pattern — don't do this
function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
}
```

```tsx
// ✅ Use TanStack Query instead
function UserList() {
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn:  () => api('/api/users'),
  })
}
```

**Why it's bad:** Race conditions, no caching, no deduplication, boilerplate in every component.

---

### ❌ Storing server data in Zustand

```ts
// ❌ Anti-pattern
const useUsersStore = create((set) => ({
  users: [],
  fetchUsers: async () => {
    const data = await api('/api/users')
    set({ users: data })
  },
}))
```

**Why it's bad:** You're reinventing TanStack Query — poorly. No cache invalidation, no background refresh, no deduplication.

✅ Use TanStack Query for server data. Zustand is for client-only state.

---

### ❌ Putting business logic in layout components

```tsx
// ❌ Anti-pattern — layout doing too much
function DashboardLayout() {
  const { data: user }        = useQuery({ queryKey: ['me'], queryFn: getMe })
  const { data: permissions } = useQuery({ queryKey: ['permissions'], queryFn: getPermissions })

  if (!user) return <Redirect to="/login" />

  return (
    <div>
      <Sidebar permissions={permissions} />
      <Outlet />
    </div>
  )
}
```

✅ Move auth checks to `beforeLoad` in the route definition. Layouts should only handle visual structure.

---

### ❌ Not using query keys consistently

```ts
// ❌ Anti-pattern — magic strings everywhere
useQuery({ queryKey: ['user', id], ... })   // in one file
useQuery({ queryKey: ['users', id], ... })  // in another (typo!)
queryClient.invalidateQueries({ queryKey: ['user'] }) // won't invalidate the right thing
```

```ts
// ✅ Centralize query keys
export const userKeys = {
  all:    ['users'] as const,
  lists:  () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
}
```

---

### ❌ Using `any` type

```ts
// ❌ Anti-pattern — destroys TypeScript's value
async function getUser(id: string): Promise<any> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}
```

```ts
// ✅ Use Zod to parse and type the response
async function getUser(id: string): Promise<User> {
  const raw = await fetch(`/api/users/${id}`).then(r => r.json())
  return UserSchema.parse(raw)
}
```

---

### ❌ One giant component

```tsx
// ❌ Anti-pattern — 400-line component doing everything
function Dashboard() {
  // 20 useState hooks
  // 10 useEffect hooks
  // fetch logic, form logic, render logic...
}
```

✅ Split into: container (data fetching) → feature components (display) → shared components (reusable UI).

---

### ❌ Prop drilling through many layers

```tsx
// ❌ Anti-pattern
<App user={user}>
  <Layout user={user}>
    <Dashboard user={user}>
      <Sidebar user={user}>
        <Avatar user={user} />
      </Sidebar>
    </Dashboard>
  </Layout>
</App>
```

✅ Store the user in Zustand. Components that need it read directly from the store.

---

### ❌ Not cleaning up `useEffect`

```tsx
// ❌ Anti-pattern — memory leak
useEffect(() => {
  const interval = setInterval(fetchData, 5000)
  // No cleanup!
}, [])

// ✅ Always return a cleanup function
useEffect(() => {
  const interval = setInterval(fetchData, 5000)
  return () => clearInterval(interval) // runs when component unmounts
}, [])
```

---

### ❌ Mutating state directly (Zustand)

```ts
// ❌ Anti-pattern
const useStore = create((set, get) => ({
  items: [],
  addItem: (item) => {
    get().items.push(item) // MUTATION — React won't re-render!
  },
}))

// ✅ Always return new objects/arrays
addItem: (item) => set((state) => ({ items: [...state.items, item] }))
```

---

### ❌ Skipping Zod validation on API responses

```ts
// ❌ Anti-pattern — trusting API responses blindly
const user = await fetch('/api/me').then(r => r.json())
// If the API returns unexpected shape, runtime errors happen silently

// ✅ Validate with Zod
const raw  = await fetch('/api/me').then(r => r.json())
const user = UserSchema.parse(raw) // throws with clear error if shape is wrong
```

---

## 21. Best Practices Summary

### Routing
- Always use `__root.tsx` for the global layout
- Use nested routes for section-specific layouts
- Use `beforeLoad` for auth guards — not component-level checks
- Always handle the catch-all route with `$.tsx`

### Data Fetching
- Use **TanStack Query** for all server data — never `useEffect` + `useState`
- Centralize query keys in a `keys` object per feature
- Invalidate queries after mutations to keep data fresh
- Use `staleTime` to control how long data is considered fresh

### State Management
- **TanStack Query** → server state
- **Zustand** → client state (UI, session, preferences)
- **TanStack Form** → form state
- Never mix these responsibilities

### Validation
- Use **Zod** for all data boundaries: API responses, form inputs, env vars
- Infer TypeScript types from Zod schemas — never define types and schemas separately

### Auth
- Store user globally in Zustand with `persist` middleware
- Use `beforeLoad` in TanStack Router for route-level guards
- Use wrapper components (`Protected`, `AdminOnly`) as a secondary check
- Never check auth inside the API layer itself

### Layouts
- Root → app shell (header, footer, global nav)
- Nested → feature shell (dashboard sidebar, admin nav)
- Never put business logic inside layout components

### Errors
- Handle errors at the route level with `errorComponent`
- Have a global fallback in `__root.tsx`
- Map HTTP status codes to meaningful errors in the API wrapper

### TypeScript
- Never use `any` — use `unknown` and narrow with Zod
- Leverage `z.infer<typeof Schema>` to generate types
- Use TanStack Router's type-safe `useParams`, `useSearch` hooks

### Code Quality
- Name your constants — no magic numbers
- Keep business rules in a domain layer, not in components
- One `useEffect` = one concern
- Derive values from state instead of duplicating them
- Let parents control layout; keep components self-contained

### Styling
- Use Tailwind for layout, spacing, common styles
- Use scoped CSS for complex animations, pseudo-elements, third-party overrides
- Extract long class lists into named components

---

## 22. Mental Model

Think of the layers as departments in a company:

```
┌─────────────────────────────────────────────────┐
│  PROVIDERS           Global infrastructure       │
│  (QueryClient, Auth) Initialized once at startup │
├─────────────────────────────────────────────────┤
│  ROUTER              URL → Component mapping     │
│  (TanStack Router)   Loaders, guards, params     │
├─────────────────────────────────────────────────┤
│  LAYOUTS             Visual structure            │
│  (__root, dashboard) Shell, sidebar, nav         │
├─────────────────────────────────────────────────┤
│  GUARDS              Access control              │
│  (Protected, Admin)  Who can see what            │
├─────────────────────────────────────────────────┤
│  FEATURES            Business logic              │
│  (auth, users, etc.) Hooks, API calls, stores    │
├─────────────────────────────────────────────────┤
│  QUERY               Server state (remote data)  │
│  (TanStack Query)    Cache, fetch, sync          │
├─────────────────────────────────────────────────┤
│  STORE               Client state (local data)   │
│  (Zustand)           Session, UI, preferences    │
├─────────────────────────────────────────────────┤
│  VALIDATION          Data integrity              │
│  (Zod)               Schemas, types, parsing     │
└─────────────────────────────────────────────────┘
```

All the patterns in this guide push toward the same three principles:

> **Clarity over cleverness — Structure over ad-hoc code — Predictability over convenience**
>
> Or even more simply: make your code easier to reason about, even if it takes a few more lines.

---

## 23. External References

### Official Documentation

| Topic | Link |
|---|---|
| React (Official Docs) | https://react.dev |
| React Hooks Reference | https://react.dev/reference/react/hooks |
| Rules of Hooks | https://react.dev/reference/rules/rules-of-hooks |
| You Might Not Need an Effect | https://react.dev/learn/you-might-not-need-an-effect |
| TanStack Query | https://tanstack.com/query/latest |
| TanStack Router | https://tanstack.com/router/latest |
| TanStack Form | https://tanstack.com/form/latest |
| Zustand | https://zustand.docs.pmnd.rs |
| Zod | https://zod.dev |
| TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/intro.html |
| Tailwind CSS | https://tailwindcss.com/docs |
| Vite | https://vitejs.dev |
| Bun | https://bun.sh/docs |
| Oxlint | https://oxc.rs/docs/guide/usage/linter.html |
| React DevTools | https://react.dev/learn/react-developer-tools |
| React Query Devtools | https://tanstack.com/query/latest/docs/framework/react/devtools |
| MDN — HTML Elements | https://developer.mozilla.org/en-US/docs/Web/HTML/Element |
| MDN — ARIA | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA |
| WCAG 2.1 Guidelines | https://www.w3.org/TR/WCAG21/ |
| The A11Y Project | https://www.a11yproject.com/ |

### Articles

| Topic | Link |
|---|---|
| Thinking in React | https://react.dev/learn/thinking-in-react |
| A Complete Guide to useEffect (Overreacted) | https://overreacted.io/a-complete-guide-to-useeffect/ |
| TanStack Query — Practical React Query | https://tkdodo.eu/blog/practical-react-query |
| Zustand — Why Zustand? | https://zustand.docs.pmnd.rs/getting-started/introduction |
| Bulletproof React (architecture guide) | https://github.com/alan2207/bulletproof-react |
| React folder structure best practices | https://www.robinwieruch.de/react-folder-structure/ |

### YouTube Videos

#### Primary Sources

Videos watched in the making of this guide — topics and code examples are directly drawn from these.

| Title | Link |
|---|---|
| React State Management Just Got Way Easier | https://www.youtube.com/watch?v=h2QN8cBsy-A |
| I thought I was a Senior React Dev... until I ran React Doctor. by BetterStack | https://www.youtube.com/watch?v=k3vyIIEZfU4 |
| All 17 React Best Practices (IMPORTANT!) by ByteGrad | https://www.youtube.com/watch?v=5r25Y9Vg2P4 |

#### Further Reading

| Topic | Channel / Link |
|---|---|
| React in 100 Seconds | Fireship — https://www.youtube.com/watch?v=Tn6-PIqc4UM |
| React Hooks Explained | Web Dev Simplified — https://www.youtube.com/watch?v=O6P86uwfdR0 |
| TanStack Query Tutorial | TkDodo — https://www.youtube.com/watch?v=r8Dg0KVnfMA |
| TanStack Router Full Course | Jack Herrington — https://www.youtube.com/watch?v=4sslBg8LprE |
| Zustand — State Management | Cosden Solutions — https://www.youtube.com/watch?v=_ngCLZ5Iz-0 |
| Zod Tutorial | Total TypeScript — https://www.youtube.com/watch?v=L6BE-U3oy80 |
| React DevTools Profiler | React team — https://www.youtube.com/watch?v=00RoZflFE34 |
| Bun in 100 Seconds | Fireship — https://www.youtube.com/watch?v=U4JVw8K19uY |
| Tailwind CSS Tutorial | Tailwind Labs — https://www.youtube.com/watch?v=pfaSUYaSgRo |
| Bulletproof React Architecture | Jack Herrington — https://www.youtube.com/watch?v=zPLQJFGFlGY |