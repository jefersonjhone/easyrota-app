import { createFileRoute } from '@tanstack/react-router'
import { VerifyCodePage } from '@features/auth/ui/VerifyCodePage'

export const Route = createFileRoute('/app/verificar')({
  component: VerifyCodePage,
})
