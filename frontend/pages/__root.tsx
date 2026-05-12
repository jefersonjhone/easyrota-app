/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import {
  useAuthBootstrap,
} from "@/features/auth/hooks/useAuthBootstrap"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const {
    isLoading,
  } = useAuthBootstrap()
  console.log(isLoading)
  if (isLoading) {

    return (
      <div>
        Loading...
      </div>
    )
  }
  return (
    <React.Fragment>
      
      <Outlet />
    </React.Fragment>
  )
}
