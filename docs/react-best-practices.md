# React Best Practices Guide

---

## Table of Contents

1. [Core Architecture Overview](#1-core-architecture-overview)
2. [Key Concepts for Beginners](#2-key-concepts-for-beginners)
   - [What is a Hook?](#what-is-a-hook)
   - [What is a `create*` function?](#what-is-a-create-function)
3. [TanStack — The Swiss Army Knife](#3-tanstack--the-swiss-army-knife)
   - [TanStack Query](#tanstack-query-formerly-react-query)
   - [TanStack Router](#tanstack-router)
   - [TanStack Form](#tanstack-form)
4. [Zod — Schema Validation](#4-zod--schema-validation)
5. [Zustand — Client State Management](#5-zustand--client-state-management)
6. [Providers (Global Infrastructure)](#6-providers-global-infrastructure)
7. [File-Based Routing](#7-file-based-routing-tanstack-router)
8. [Root & Nested Layouts](#8-root--nested-layouts)
9. [Authentication System](#9-authentication-system)
10. [Error Handling](#10-error-handling)
11. [API Layer](#11-api-layer)
12. [Subdomains](#12-subdomains)
13. [Common Anti-Patterns](#13-common-anti-patterns)
14. [Best Practices Summary](#14-best-practices-summary)
15. [Mental Model](#15-mental-model)

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

## 3. TanStack — The Swiss Army Knife

[TanStack](https://tanstack.com) is a collection of open-source libraries by [Tanner Linsley](https://github.com/tannerlinsley) that solve some of the hardest frontend problems in a type-safe, framework-agnostic way. They work with React, Vue, Solid, Svelte, and Angular.

> 📖 Reference: [TanStack Homepage](https://tanstack.com)

---

### TanStack Query (formerly React Query)

**What it solves:** Managing **server state** — data that lives on a server and needs to be fetched, cached, synced, and updated.

Without TanStack Query, you'd manually write `useEffect` + `useState` + loading/error flags for every API call. TanStack Query replaces all of that.

> 📖 Reference: [TanStack Query Docs](https://tanstack.com/query/latest)

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
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
}

function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => api<User[]>('/api/users'),
  })
}

// Usage in a component
function UserList() {
  const { data, isLoading, isError, error } = useUsers()

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>Error: {error.message}</p>

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
  __root.tsx          ← Root layout (wraps everything)
  index.tsx           ← Matches /
  login.tsx           ← Matches /login
  dashboard.tsx       ← Matches /dashboard (layout)
  dashboard.users.tsx ← Matches /dashboard/users
  dashboard.settings.tsx
  $.tsx               ← Catch-all (404)
```

---

### TanStack Form

**What it solves:** Type-safe, performant forms without re-rendering the entire form on every keystroke.

> 📖 Reference: [TanStack Form Docs](https://tanstack.com/form/latest)

#### Why not just use controlled inputs?

With regular controlled inputs (`useState` per field), the whole component re-renders on every keystroke. For large forms, this causes performance issues. TanStack Form uses a field-level subscription model.

```tsx
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { zodValidator } from '@tanstack/zod-form-adapter'

// Define your schema with Zod (see section 4)
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function LoginForm() {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validatorAdapter: zodValidator(),
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      console.log('Submitting:', value) // fully typed!
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors && (
              <span>{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>

      <button type="submit">Login</button>
    </form>
  )
}
```

---

## 4. Zod — Schema Validation

**What it is:** A TypeScript-first schema declaration and validation library. You define the shape and rules of your data once, and Zod gives you both runtime validation **and** TypeScript types for free.

> 📖 Reference: [Zod Docs](https://zod.dev)

**What it solves:**
- Validating API responses so bad data doesn't crash your app
- Validating form inputs before submission
- Generating TypeScript types from your validation schemas (DRY)
- Runtime type checking (TypeScript alone only checks at compile time)

```ts
import { z } from 'zod'

// Define a schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Must be a valid email'),
  age: z.number().min(18, 'Must be 18 or older').optional(),
  role: z.enum(['user', 'admin']),
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
z.array(UserSchema)       // User[]
z.array(z.string()).min(1) // non-empty string array

// Union types
z.union([z.string(), z.number()])

// Transform (parse then transform)
z.string().transform((val) => val.trim().toLowerCase())

// Refinement (custom validation)
z.string().refine((val) => val.includes('@'), { message: 'Must contain @' })
```

---

## 5. Zustand — Client State Management

**What it is:** A minimal, fast state management library for React. Think of it as a global `useState` that any component can access — without the complexity of Redux.

> 📖 Reference: [Zustand Docs](https://zustand.docs.pmnd.rs)

**What it solves:** Sharing state between components that aren't parent-child related, without prop drilling or complex Context boilerplate.

### When to use Zustand vs TanStack Query

| State Type | Use | Example |
|---|---|---|
| Server data (from API) | TanStack Query | List of users, a product |
| Client UI state | Zustand | Sidebar open/closed, current theme |
| Auth session | Zustand | Logged-in user object |
| Form data | TanStack Form | Input values during editing |

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

### Using a store in components

```tsx
// Only re-renders when `user` changes — not the whole store
function Header() {
  const user = useAuthStore((state) => state.user)
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

## 6. Providers (Global Infrastructure)

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

## 7. File-Based Routing (TanStack Router)

Instead of manually configuring routes in a big array, each file in `routes/` **automatically becomes a route**. The filename dictates the URL.

> 📖 Reference: [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)

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

## 8. Root & Nested Layouts

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

## 9. Authentication System

### User model

```ts
// features/auth/types.ts
export type UserRole = 'user' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}
```

### Auth store (Zustand)

```ts
// features/auth/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from './types'

type AuthState = {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
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

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)

  if (user?.role !== 'admin') {
    return <Navigate to="/" />
  }

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

### Auth with TanStack Router (beforeLoad)

A more integrated approach using the router's `beforeLoad` hook:

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

---

## 10. Error Handling

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

## 11. API Layer

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
  list: () => api<User[]>('/api/users'),
  detail: (id: string) => api<User>(`/api/users/${id}`),
  create: (body: Omit<User, 'id'>) => api<User>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<User>) => api<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/users/${id}`, { method: 'DELETE' }),
}
```

---

## 12. Subdomains

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
    if (sub === 'app') return 'app'
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

## 13. Common Anti-Patterns

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

  // ... render
}
```

```tsx
// ✅ Use TanStack Query instead
function UserList() {
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => api('/api/users'),
  })
  // ... render
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
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: getMe })
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
useQuery({ queryKey: ['user', id], ... }) // in one file
useQuery({ queryKey: ['users', id], ... }) // in another (typo!)
queryClient.invalidateQueries({ queryKey: ['user'] }) // won't invalidate the right thing
```

```ts
// ✅ Centralize query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
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
  // fetch logic
  // form logic
  // render logic
  // ...
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
const raw = await fetch('/api/me').then(r => r.json())
const user = UserSchema.parse(raw) // throws with clear error if shape is wrong
```

---

## 14. Best Practices Summary

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

---

## 15. Mental Model

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

---

## External References

| Topic | Link |
|---|---|
| React Docs (Official) | https://react.dev |
| React Hooks Reference | https://react.dev/reference/react/hooks |
| TanStack Query | https://tanstack.com/query/latest |
| TanStack Router | https://tanstack.com/router/latest |
| TanStack Form | https://tanstack.com/form/latest |
| Zustand | https://zustand.docs.pmnd.rs |
| Zod | https://zod.dev |
| TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/intro.html |
| Vite | https://vitejs.dev |
| React Query Devtools | https://tanstack.com/query/latest/docs/framework/react/devtools |
| Python Best Practices (Backend) | https://realpython.com/tutorials/best-practices/ |