import AppLayout from '@/lib/layout/app-layout'
import ProfileHeader from '@/features/user-home/ui/ProfileHeader'
import { ProfileStats } from '@/features/user-home/ui/ProfileStats'
import { TripsHistoryCard } from '@/features/user-home/ui/ProfileTripsHistory'

import { useProfileUser } from '@/features/user-home/hooks/useProfileUser'

export function ProfilePage() {
  const { data: profileUser, isPending, isError } = useProfileUser()

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error</div>
  
  return <AppLayout >
    <div className='max-w-270 w-full mx-auto items-start mt-4 h-fit'>
      <ProfileHeader user={profileUser} />
      <ProfileStats user={profileUser} />
      
      <div className="w-full sm:px-0 mt-6 ">
        <TripsHistoryCard />
      </div>
    </div>
  </AppLayout>
}
