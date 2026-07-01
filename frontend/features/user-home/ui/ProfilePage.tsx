import { motion } from "motion/react";
import AppLayout from '@/lib/layout/app-layout'
import ProfileHeader from '@/features/user-home/ui/ProfileHeader'
import { ProfileStats } from '@/features/user-home/ui/ProfileStats'
import { TripsHistoryCard } from '@/features/user-home/ui/ProfileTripsHistory'
import { PunishmentsHistoryCard } from '@/features/user-home/ui/ProfilePunishment'
import { GuestHistoryCard } from '@/features/user-home/ui/GuestHistoryCard'

import { useProfileUser } from '@/features/user-home/hooks/useProfileUser'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

export function ProfilePage() {
  const { data: profileUser, isPending, isError } = useProfileUser()

  if (isPending) {
    return (
      <AppLayout>
        <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Carregando perfil...
          </div>
        </section>
      </AppLayout>
    )
  }

  if (isError) {
    return (
      <AppLayout>
        <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="rounded-4xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Erro ao carregar perfil. Tente novamente.
          </div>
        </section>
      </AppLayout>
    )
  }

  const isCivilServant = profileUser?.profile_type === 'CIVIL-SERVANT'

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}>
          <ProfileHeader user={profileUser} />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
        >
          <ProfileStats user={profileUser} />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-6 mb-8"
        >
          <TripsHistoryCard />
          {isCivilServant ? <GuestHistoryCard /> : <PunishmentsHistoryCard />}
        </motion.div>
      </section>
    </AppLayout>
  )
}
