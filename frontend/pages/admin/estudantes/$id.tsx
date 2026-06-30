/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useParams } from '@tanstack/react-router'
import { requireAdmin } from '@/features/auth/services/require-admin'
import { UserDetailPage } from '@/features/admin/ui/users/UserDetailPage'

function StudentDetailRoute() {
  const { id } = useParams({ from: '/admin/estudantes/$id' })
  return <UserDetailPage profileType="STUDENT" profileId={id} />
}

export const Route = createFileRoute('/admin/estudantes/$id')({
  beforeLoad: requireAdmin,
  component: StudentDetailRoute,
})
