import { createFileRoute } from '@tanstack/react-router'
import { RecoveryPage } from '@features/auth/ui/recovery/RecoveryPage'

export const Route = createFileRoute('/app/recuperar')({
  component: RecoveryPage
})

