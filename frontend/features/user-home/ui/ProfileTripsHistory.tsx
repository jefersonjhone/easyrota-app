import { useTripsHistory } from "@features/user-home/hooks/useTripsHistory"
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card"
import { BusIcon } from "@phosphor-icons/react"
import type { Trip } from "@features/user-home/types"


export function TripsHistoryCard() {
  const { data: trips} = useTripsHistory(3)

  const loading = false
  const error = false
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Erro ao carregar histórico</p>
        </CardContent>
      </Card>
    )
  }

  if (!trips || trips.length === 0) {
    return (
      <Card className="w-full rounded-sm ">
        <CardHeader>
          <CardTitle>Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nenhuma viagem encontrada</p>
        </CardContent>
      </Card>
    )
  }

  const handleTripClick = (tripId: string) => {
    console.log("Apertou numa viagem: ", tripId)
  }

  return (
    <Card className="w-full rounded-sm gap-2 border-0 shadow-md  px-0 mx-0">
      <CardHeader>
        <CardTitle className="font-medium font-heading text-xl">Últimas Reservas</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-2 md:space-y-6 w-full">
          {trips.slice(0, 3).map((trip: Trip) => {
            return (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip.id)}
                className="flex justify-between p-2 border rounded-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-full flex justify-between items-center p-2 md:p-4 gap-2 md:gap-4 "
                >
                  <BusIcon className="w-12 h-12 text-white bg-primary p-1 rounded-md " />
                  <div className="flex-1 ">
                    <p className="font-semibold md:text-base font-heading">
                      {trip.origin} → {trip.destiny}
                    </p>
                    <p className="text-sm md:text-base text-gray-600">
                      {trip.trip_date} às {trip.trip_departure}
                    </p>
                  </div>
                </div>
                  <span
                    className="px-2 py-1 h-fit rounded-sm my-auto text-xs font-medium text-white bg-gray-500"
                  >
                   {trip.trip_history_status}
                  </span>
              </div>
            )
          })}

        <div className="w-full flex items center">
          <a href="/app/viagens/historico" 
          className="mx-auto py-2 text-center text-chart-3 hover:text-chart-4 font-medium md:font-semibold underline">
        
        
          Ver histórico completo
          </a>
        </div>

        </div>
        
      </CardContent>
    </Card>
  )
}