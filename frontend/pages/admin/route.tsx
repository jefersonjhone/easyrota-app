import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { requireAuth } from '@/features/auth/services/require-auth'
import { Fragment } from 'react'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    requireAuth()
    const user = useAuthStore.getState().user
    if (user?.profile_type !== 'ADMIN') {
      if (user?.profile_type === 'DRIVER') {
        throw redirect({ to: '/app/motorista' })
      } else {
        throw redirect({ to: '/app' })
      }
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <Fragment>
      <Outlet />
    </Fragment>
  )
}
