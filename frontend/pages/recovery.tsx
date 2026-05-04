import { RecoveryPage } from '@/features/auth/ui/recovery/RecoveryPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/recovery')({
  component: () => <RecoveryPage />,
})

