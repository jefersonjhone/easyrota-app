/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Outlet, createRootRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'

export const Route = createRootRoute({
  beforeLoad: async () => {
    const { user, accessToken } = useAuthStore.getState()
    
    if (!user || !accessToken) {
      throw redirect({ to: '/login' })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}
