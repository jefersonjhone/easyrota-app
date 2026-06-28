import { createFileRoute } from '@tanstack/react-router'
import { PrivateTripPage } from '@/features/trips/ui/PrivateTripPage'
import { z } from 'zod'

export const Route = createFileRoute('/app/viagens/privada')({
  validateSearch: z.object({
    code: z.string().optional()
  }),
  component: () => {
    const { code } = Route.useSearch()
    return <PrivateTripPage code={code} />
  }
})
