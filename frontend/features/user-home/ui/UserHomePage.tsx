import { motion } from "motion/react";
import AppLayout from '@layout/app-layout'
import { useAuthStore } from '@features/auth/store/auth-store'

import { useUserHomeDashboard } from '../hooks/useUserHomeDashboard'
import { UserHomeHero } from './UserHomeHero'
import { UserHomeHistoryCard } from './UserHomeHistoryCard'
import { UserHomeTripCard } from './UserHomeTripCard'
import { UserTripRequestsCard } from './UserTripRequestsCard'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

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
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}>
          <UserHomeHero
            fullName={user?.full_name}
            profileType={user?.profile_type}
            email={user?.email}
            totalTrips={totalTrips}
          />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
          >
          <div className="flex flex-col gap-6">
            <UserHomeTripCard
              currentTrip={currentTrip}
              isLoading={isLoading}
              error={tripError}
            />
            {user?.profile_type === 'CIVIL-SERVANT' ? <UserTripRequestsCard /> : null}
          </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="space-y-6"
          >
            <UserHomeHistoryCard
              reservations={reservationHistory.slice(0, 3)}
              error={historyError}
            />
          </motion.div>
        </div>
      </section>
    </AppLayout>
  )
}
