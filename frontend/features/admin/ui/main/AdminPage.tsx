import { useState } from 'react'

// Components
import { AdminLayout } from '@/features/admin/ui/Layout'
import { TotalUsersCard } from '@/features/admin/ui/main/cards/usersCard'
import { TotalBusesCard } from '@/features/admin/ui/main/cards/busesCard'
import { TotalTripsCard, TripsInProgress } from '@/features/admin/ui/main/cards/tripsCard'
import { TotalDriversCard } from '@/features/admin/ui/main/cards/driversCard'
import { TripsTable } from '@/features/admin/ui/main/charts/routes'
import { MostReservedTripsTable } from '@/features/admin/ui/main/charts/reservations'
import { ChartLineDefault, ChartBarMixed } from '@/features/admin/ui/main/charts/trips'

// hooks
import { useIsMobile } from '@/lib/ui/hooks/use-mobile'
import { useUsersGrowth } from '@/features/admin/hooks/dashboard/useUsersCount'
import { useDriversCount } from '@/features/admin/hooks/dashboard/useDriversCount'
import { useBusCount } from '@/features/admin/hooks/dashboard/useBusCount'
import { useTripsCreatedCount } from '@/features/admin/hooks/dashboard/useTripsCreatedCount'
import { useTripsInProgressCount } from '@/features/admin/hooks/dashboard/useTripsInProgressCount'
import { useTripsHistory } from '@/features/admin/hooks/dashboard/useTripsHistory'
import { useTripsByStatus } from '@/features/admin/hooks/dashboard/useTripsByStatus'
import { useTripsByRoute } from '@/features/admin/hooks/dashboard/useTripsByRoute'
import { CheckinStatsCard } from '@/features/admin/ui/main/charts/checkin'
import { useCheckinStats } from '@/features/admin/hooks/dashboard/useCheckinStats'
import { useReservationsByRoute } from '@/features/admin/hooks/dashboard/useReservationsByRoute'





const AdminPage = () => {
  const [filter, setFilter] = useState(-1)
  const [days, setDays] = useState(0)
  const [historyDays, setHistoryDays] = useState(7)
  const [statusDays, setStatusDays] = useState(7)
  const [routeDays, setRouteDays] = useState(7)
  const [checkinDays, setCheckinDays] = useState(7)
  const [reservationDays, setReservationDays] = useState(7)
  const isMobile = useIsMobile()
  
  const { data: usersData} = useUsersGrowth(filter)
  const { data: driversData} = useDriversCount()
  const { data: busesData} = useBusCount()
  const { data: tripsData} = useTripsCreatedCount(days)
  const { data: tripsInProgressData} = useTripsInProgressCount()
  const { data: tripsHistoryData} = useTripsHistory(historyDays)
  const { data: tripsByStatusData } = useTripsByStatus(statusDays)
  const { data: tripsByRouteData} = useTripsByRoute(routeDays)
  const { data: checkinStatsData} = useCheckinStats(checkinDays)
  const { data: reservationsByRouteData} = useReservationsByRoute(reservationDays)

  return (
    <AdminLayout>
      <section className="max-w-300 mx-auto flex flex-col gap-y-12 md:gap-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 md:h-82 mb-12">
          {
            usersData !== undefined && <TotalUsersCard
            users_data={usersData}
            onFilterChange={setFilter}
            isMobile={isMobile}
            />
          }
          <div className='grid grid-cols-2 md:col-span-2 w-full gap-2 md:gap-6'>
            <TotalDriversCard total={driversData?.total_drivers ?? 0} />
             <TotalBusesCard total={busesData?.total_buses ?? 0} />
             <TotalTripsCard total={tripsData?.total_trips ?? 0} onFilterChange={setDays} />
            <TripsInProgress total={tripsInProgressData?.total_trips ?? 0} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChartLineDefault chartData={tripsHistoryData??[]} onFilterChange={setHistoryDays} />
          <ChartBarMixed chartData={tripsByStatusData ?? { days: 0, total_trips: 0, trips: [] }} onFilterChange={setStatusDays} />
        </div>
        <TripsTable data={tripsByRouteData ?? []} onFilterChange={setRouteDays} />
       <CheckinStatsCard data={checkinStatsData ?? { total_checkins: 0, without_checkin: 0, checkin_rate: 0 }} onFilterChange={setCheckinDays} />
      <MostReservedTripsTable
          data={reservationsByRouteData ?? []}
          onFilterChange={setReservationDays} />
      </section>
    </AdminLayout>
  ) 
}


export default AdminPage
