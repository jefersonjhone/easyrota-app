import { createFileRoute } from '@tanstack/react-router'

import { LoginForms } from './login/LoginForms'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const paths = {
    createAccount: "/",
    recoverPassword: "/",
}

function LoginPage() {
  return <main className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
        <LoginForms paths={paths} />
    </main>
}
