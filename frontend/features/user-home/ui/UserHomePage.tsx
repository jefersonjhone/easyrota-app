import AppLayout from '@layout/app-layout'
import { useAuthStore } from '@features/auth/store/auth-store'

import { useUserHomeDashboard } from '../hooks/useUserHomeDashboard'
import { UserHomeHero } from './UserHomeHero'
import { UserHomeHistoryCard } from './UserHomeHistoryCard'
import { UserHomeTripCard } from './UserHomeTripCard'

export function UserHomePage() {
  const user = useAuthStore((state) => state.user)
  const {
    currentTrip,
    reservationHistory,
    isLoading,
    tripError,
    historyError,
  } = useUserHomeDashboard()

  const totalTrips =
    reservationHistory[0]?.total_trips ?? reservationHistory.length

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
        <UserHomeHero
          fullName={user?.full_name}
          profileType={user?.profile_type}
          email={user?.email}
          totalTrips={totalTrips}
        />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <UserHomeTripCard
            currentTrip={currentTrip}
            isLoading={isLoading}
            error={tripError}
          />

          <div className="space-y-6">
            <UserHomeHistoryCard
              reservations={reservationHistory.slice(0, 3)}
              error={historyError}
            />
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
