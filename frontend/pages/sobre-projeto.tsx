import { createFileRoute } from '@tanstack/react-router'

import { SobreProjetoPage } from '@features/landing/ui/SobreProjetoPage'

export const Route = createFileRoute('/sobre-projeto')({
  component: SobreProjetoPage,
})
