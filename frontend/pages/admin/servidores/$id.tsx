import { createFileRoute, useParams } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { UserDetailPage } from '@/features/admin/ui/users/UserDetailPage'

function CivilServantDetailRoute() {
  const { id } = useParams({ from: '/admin/servidores/$id' })
  return <UserDetailPage profileType="CIVIL-SERVANT" profileId={id} />
}

export const Route = createFileRoute('/admin/servidores/$id')({
  beforeLoad: requireAdmin,
  component: CivilServantDetailRoute,
})
