/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/services/require-auth'
import { subscribeUserToPush } from '@/lib/push-notifications'

export const Route = createRootRoute({
  beforeLoad: requireAuth,
  component: RootComponent,
})

function RootComponent() {
  React.useEffect(() => {
    subscribeUserToPush().catch(console.error)
  }, [])

  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}
