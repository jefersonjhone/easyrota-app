/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

import { LoginForms } from './login/LoginForms'
import './login/style.css'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const paths = {
    createAccount: "/",
    recoverPassword: "/",
}

function LoginPage() {
  return <main className='background flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
        <LoginForms paths={paths} />
    </main>
}
