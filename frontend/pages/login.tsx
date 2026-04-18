import { createFileRoute } from '@tanstack/react-router'

import { LoginForms } from './login/LoginForms'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

let paths = {
    createAccount: "/",
    recoverPassword: "/",
}

function RouteComponent() {
  return <LoginForms paths={paths} />
}
