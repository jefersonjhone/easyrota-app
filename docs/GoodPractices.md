## Backend

See the best practices for Python at [RealPython](https://realpython.com/tutorials/best-practices/).


## Frontend

### 1. Core Architecture Overview

#### Layers

- `app/`
- `providers/`: global context (query, auth, router setup)
- `pages/`: file-based routing (TanStack Router)
- `features/`: business logic (auth, users, admin, etc.)
- `shared/`: reusable utilities/components

### 2. Providers (Global Infrastructure)

#### What providers are

Providers are React components that inject **global dependencies** into the app tree.

They exist to avoid:
- Prop drilling
- Reinitializing services
- Tight coupling between features

#### Main providers used

**Query Provider (server state cache)**

`app/providers/query-client.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

`app/providers/index.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './query-client'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

#### Optional providers (commonly added)

* AuthProvider (user/session)
* ThemeProvider
* Feature flags provider


### 3. File-Based Routing (TanStack Router)

#### Folder structure

```
routes/
  __root.tsx
  index.tsx
  login.tsx
  dashboard.tsx
  dashboard.admin.tsx
  error.tsx
```

Each file is a route.

### 4. Root Layout (VERY IMPORTANT)

#### Where layout goes

**ALWAYS in:**

```
routes/__root.tsx
```

#### Root layout example

```tsx
import { Outlet } from '@tanstack/react-router'

export default function RootLayout() {
  return (
    <div>
      <header>Global Header</header>
      <main>
        <Outlet />
      </main>
      <footer>Footer</footer>
    </div>
  )
}
```

#### What Root Layout is responsible for

* App shell (header/footer)
* Global modals
* Global navigation
* Theme wrappers

#### What it should NOT include

* API calls
* Business logic
* Feature-specific UI
* Authentication checks (except global redirect fallback)


### 5. Nested Layouts

#### Example: Dashboard layout

```
pages/
  dashboard.tsx
  dashboard.users.tsx
  dashboard.settings.tsx
```

`pages/dashboard.tsx`
```tsx
import { Outlet } from '@tanstack/react-router'

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <aside>Sidebar</aside>
      <section>
        <Outlet />
      </section>
    </div>
  )
}
```


#### Behavior

* `/dashboard` → layout only or dashboard home
* `/dashboard/users` → renders inside Outlet

### 6. Authentication System (Logged Users)

#### User model (example)

```ts
type User = {
  id: string
  role: 'user' | 'admin'
}
```

#### Auth store

```ts
import { create } from 'zustand'

type AuthState = {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

#### Protected route pattern

```tsx
import { Navigate } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store'

export function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}
```

#### Role-based protection (Admins)

```tsx
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)

  if (user?.role !== 'admin') {
    return <Navigate to="/" />
  }

  return children
}
```

#### Usage in routes

```tsx
export default function AdminPage() {
  return (
    <AdminOnly>
      <div>Admin Panel</div>
    </AdminOnly>
  )
}
```

### 7. Error Handling (404, 500, etc.)

#### 404 Not Found

`pages/not-found.tsx`:

```tsx
export default function NotFound() {
  return <h1>404 - Page not found</h1>
}
```

#### Catch-all route (important)

`pages/$.tsx`:

```tsx
export default function CatchAll() {
  return <h1>404 - Unknown route</h1>
}
```

#### Global error boundary

`pages/__root.tsx`:

```tsx
export function ErrorComponent({ error }: { error: Error }) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
    </div>
  )
}
```

#### Server errors (500-style)

Handled via:

* `errorElement`
* route-level error boundaries
* query error states

### 8. API Layer (No Axios)

#### Native fetch wrapper

```ts
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json()
}
```

### 9. Subdomains

#### Why subdomains matter

They allow:

* Separation of concerns
* Different apps under same backend
* Independent layouts/permissions

#### Approach 1: Host-based routing (recommended)

**Detect hostname**

```ts
export function getSubdomain() {
  const host = window.location.hostname

  // localhost special case
  if (host.includes('localhost')) return 'app'

  const parts = host.split('.')

  if (parts.length > 2) {
    return parts[0] // admin.my-app.com → admin
  }

  return 'app'
}
```

#### Route guard based on subdomain

```tsx
export function SubdomainGuard({ children }: { children: React.ReactNode }) {
  const subdomain = getSubdomain()

  if (subdomain === 'admin') {
    return <AdminOnly>{children}</AdminOnly>
  }

  return children
}
```

#### App structure with subdomains

```
app.easyrota.com     → user app
admin.easyrota.com   → admin panel
```

### 10. Localhost Subdomain Setup

#### Option 1: /etc/hosts (best)

Add:

```
127.0.0.1 app.localhost
127.0.0.1 admin.localhost
```

Then use:

* http://app.localhost:5173
* http://admin.localhost:5173

#### Option 2: Vite config

```ts
server: {
  host: true,
}
```

#### Option 3: Vite preview

Use preview mode for testing production-like domains.

### 11. Routing + Subdomain Architecture (Recommended)

```
pages/
  __root.tsx
  index.tsx              → app home
  login.tsx

  admin/
    __root.tsx           → admin layout
    index.tsx
    users.tsx
```

Then combine with subdomain guard.

### 12. Best Practices Summary

#### Routing

* Always use `__root.tsx` for layout
* Use nested routes for sections
* Avoid manual route configs unless necessary

#### Auth

* Store user globally
* Use guards (`Protected`, `AdminOnly`)
* Never check auth inside API layer

#### Layouts

* Root → app shell
* Nested → feature shell (dashboard/admin)
* Never mix business logic with layout

#### Errors

* `$.tsx` for unknown routes
* Error boundaries per route
* Global root error fallback

#### Subdomains

* Detect via hostname
* Use guard components
* Map subdomain → feature area

### 13. Mental Model

* Providers → global infrastructure
* Routes → URL structure
* Layouts → visual structure
* Guards → access control
* Query → server state
* Store → client state
