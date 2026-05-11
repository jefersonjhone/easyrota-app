import { createFileRoute } from '@tanstack/react-router'

import { EquipePage } from '@features/landing/ui/EquipePage'

export const Route = createFileRoute('/equipe')({
  component: EquipePage,
})
