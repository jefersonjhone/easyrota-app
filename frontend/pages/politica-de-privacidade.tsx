import { createFileRoute } from '@tanstack/react-router'

import { PrivacyPolicyPage } from '@features/landing/ui/LegalPage'

export const Route = createFileRoute('/politica-de-privacidade')({
  component: PrivacyPolicyPage,
})
