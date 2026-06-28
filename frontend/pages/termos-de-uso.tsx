import { createFileRoute } from '@tanstack/react-router'

import { TermsOfServicePage } from '@features/landing/ui/LegalPage'

export const Route = createFileRoute('/termos-de-uso')({
  component: TermsOfServicePage,
})
