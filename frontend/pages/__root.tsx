import { Outlet, createRootRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/features/not-found/ui/NotFoundPage'
import { Fragment } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {

  return (
    <Fragment>
      
      <Outlet />
    </Fragment>
  )
}
