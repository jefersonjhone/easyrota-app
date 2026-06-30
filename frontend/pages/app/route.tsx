import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { requireAuth } from '@/features/auth/services/require-auth'
import { syncBrowserPushSubscription } from '@/lib/push-notifications'
import { Fragment, useEffect } from 'react'

export const Route = createFileRoute('/app')({
  beforeLoad: ({ location }) => {
    requireAuth()
    const user = useAuthStore.getState().user
    const isMotoristaPath = location.pathname.startsWith('/app/motorista')

    if (isMotoristaPath) {
      if (user?.profile_type !== 'DRIVER') {
        if (user?.profile_type === 'ADMIN') {
          throw redirect({ to: '/admin' })
        } else {
          throw redirect({ to: '/app' })
        }
      }
    } else {
      if (user?.profile_type !== 'STUDENT' && user?.profile_type !== 'CIVIL-SERVANT') {
        if (user?.profile_type === 'DRIVER') {
          throw redirect({ to: '/app/motorista' })
        } else if (user?.profile_type === 'ADMIN') {
          throw redirect({ to: '/admin' })
        } else {
          throw redirect({ to: '/login' })
        }
      }
    }
  },
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    syncBrowserPushSubscription().catch(console.error)
  }, [])

  return (
    <Fragment>
      <Outlet />
    </Fragment>
  )
}
