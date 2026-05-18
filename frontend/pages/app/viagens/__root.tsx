/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/services/require-auth'

export const Route = createRootRoute({
  beforeLoad: requireAuth,
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}
