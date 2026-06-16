/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/features/not-found/ui/NotFoundPage'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {

  return (
    <React.Fragment>
      
      <Outlet />
    </React.Fragment>
  )
}
