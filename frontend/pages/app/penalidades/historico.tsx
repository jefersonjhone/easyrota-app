import { createFileRoute } from '@tanstack/react-router'
import { PunishmentsHistoryPage } from '@features/user-home/ui/UserPunishmentHistory'

export const Route = createFileRoute('/app/penalidades/historico')({
    component: PunishmentsHistoryPage,
})