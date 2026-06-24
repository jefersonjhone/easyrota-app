import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/motorista/viagens')({
  beforeLoad: () => {
    throw redirect({ to: '/app/motorista' })
  },
})
