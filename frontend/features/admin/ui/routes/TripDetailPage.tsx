import { useState, Fragment } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTripAdminDetail } from '@/features/admin/hooks/useTripAdminDetail'
import {
  useAdminAssignDriver,
  useAdminUnassignDriver,
  useAdminAssignBus,
  useAdminUnassignBus,
} from '@/features/admin/hooks/useTripAdminActions'
import { fetchDrivers, fetchBuses } from '@/features/admin/services/trip-admin-actions'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { ArrowLeftIcon, ArrowRightIcon, Check, DownloadSimple, Printer, X, User, Bus, MapPin, Users, CalendarBlank, UserPlus, PencilSimpleIcon } from '@phosphor-icons/react'
import { Button } from '@ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@ui/dropdown-menu'
import { AddPassengerModal } from './AddPassengerModal'
import { API_URL } from '@lib/config'
import { useAuthStore } from '@/features/auth/store/auth-store'

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMADA: 'bg-blue-100 text-blue-800 border-blue-200',
    'EM ANDAMENTO': 'bg-green-100 text-green-800 border-green-200',
    CONCLUÍDA: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELADA: 'bg-red-100 text-red-800 border-red-200',
    'RISCO DE CANCELAMENTO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {status}
    </span>
  )
}

function passengerBadge(type: string) {
  const styles: Record<string, string> = {
    ESTUDANTE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    SERVIDOR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CONVIDADO: 'bg-orange-100 text-orange-700 border-orange-200',
    'SERVIDOR LOCAL': 'bg-teal-100 text-teal-700 border-teal-200',
    'CONVIDADO LOCAL': 'bg-amber-100 text-amber-700 border-amber-200',
  }
  const labels: Record<string, string> = {
    ESTUDANTE: 'Est',
    SERVIDOR: 'Serv',
    CONVIDADO: 'Conv',
    'SERVIDOR LOCAL': 'Serv L',
    'CONVIDADO LOCAL': 'Conv L',
  }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap ${styles[type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {labels[type] || type}
    </span>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs font-semibold tracking-[0.2em] uppercase">{label}</p>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

async function downloadExport(tripId: string, format: 'csv' | 'xlsx') {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${API_URL}/trips/${tripId}/export_passengers?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) return
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `viagem_${tripId}_passageiros.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TripDetailPage() {
  const { id } = useParams({ from: '/admin/viagens/$id' })
  const { data: trip, isLoading, error } = useTripAdminDetail(id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState(false)
  const [editingBus, setEditingBus] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [selectedBusId, setSelectedBusId] = useState<string>('')
  const editable = !!(trip && trip.status !== 'EM ANDAMENTO' && trip.status !== 'CANCELADA')

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
    enabled: editable,
  })

  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: fetchBuses,
    enabled: editable,
  })

  const assignDriver = useAdminAssignDriver(id)
  const unassignDriver = useAdminUnassignDriver(id)
  const assignBus = useAdminAssignBus(id)
  const unassignBus = useAdminUnassignBus(id)

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Carregando viagem...
          </div>
        </section>
      </AdminLayout>
    )
  }

  if (error || !trip) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Viagem não encontrada.
          </div>
          <Link to="/admin/viagens" className="block text-center">
            <button className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
              Voltar para viagens
            </button>
          </Link>
        </section>
      </AdminLayout>
    )
  }

  const occupancy = trip.seating_capacity > 0 ? Math.min((trip.active_reservations / trip.seating_capacity) * 100, 100) : 0

  return (
    <AdminLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <section id="print-content" className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
        <div className="no-print">
          <Link
            to="/admin/viagens"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            Voltar para viagens
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                Viagens e Rotas
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight mt-1">
                {trip.origin} <ArrowRightIcon size={20} className="inline text-muted-foreground" weight="bold" /> {trip.destiny}
              </h1>
            </div>
            <StatusBadge status={trip.status} />
          </div>
        </div>

        <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard
            icon={<CalendarBlank size={16} />}
            label="Data e Hora"
            value={
              <>
                {formatDate(trip.trip_date)}
                <br />
                <span className="text-muted-foreground">
                  {trip.trip_departure_time ?? trip.departure_time} → {trip.trip_arrival_time ?? trip.arrival_time}
                </span>
              </>
            }
          />
          <InfoCard
            icon={<User size={16} />}
            label="Motorista"
            value={
              editingDriver ? (
                <div className="space-y-2">
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <option value="">Nenhum</option>
                    {drivers?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} — {d.cnh}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDriverId === '') {
                          unassignDriver.mutate(undefined, {
                            onSuccess: () => { toast.success('Motorista removido da viagem!'); setEditingDriver(false) },
                            onError: () => toast.error('Erro ao remover motorista.'),
                          })
                        } else {
                          assignDriver.mutate(selectedDriverId, {
                            onSuccess: () => { toast.success('Motorista atribuído com sucesso!'); setEditingDriver(false) },
                            onError: () => toast.error('Erro ao atribuir motorista.'),
                          })
                        }
                      }}
                      className="text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDriver(false)}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : trip.driver_name ? (
                <>
                  {trip.driver_name}
                  <br />
                  <span className="text-muted-foreground">CNH: {trip.driver_cnh}</span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDriverId(trip.driver_id ?? '')
                        setEditingDriver(true)
                      }}
                      className="block mt-1 text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
                    >
                      <PencilSimpleIcon size={12} weight="bold" className="inline mr-0.5" />
                      Alterar
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">Não atribuído</span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDriverId('')
                        setEditingDriver(true)
                      }}
                      className="block mt-1 text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
                    >
                      <PencilSimpleIcon size={12} weight="bold" className="inline mr-0.5" />
                      Atribuir
                    </button>
                  )}
                </>
              )
            }
          />
          <InfoCard
            icon={<Bus size={16} />}
            label="Ônibus"
            value={
              editingBus ? (
                <div className="space-y-2">
                  <select
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <option value="">Nenhum</option>
                    {buses?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.number_plate} — {b.brand} ({b.seating_capacity} lugares)
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBusId === '') {
                          unassignBus.mutate(undefined, {
                            onSuccess: () => { toast.success('Ônibus removido da viagem!'); setEditingBus(false) },
                            onError: () => toast.error('Erro ao remover ônibus.'),
                          })
                        } else {
                          assignBus.mutate(selectedBusId, {
                            onSuccess: () => { toast.success('Ônibus atribuído com sucesso!'); setEditingBus(false) },
                            onError: () => toast.error('Erro ao atribuir ônibus.'),
                          })
                        }
                      }}
                      className="text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBus(false)}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : trip.bus_plate ? (
                <>
                  {trip.bus_plate}
                  <br />
                  <span className="text-muted-foreground">{trip.bus_brand} · {trip.bus_capacity} lugares</span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBusId(trip.bus_id ?? '')
                        setEditingBus(true)
                      }}
                      className="block mt-1 text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
                    >
                      <PencilSimpleIcon size={12} weight="bold" className="inline mr-0.5" />
                      Alterar
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">Não atribuído</span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBusId('')
                        setEditingBus(true)
                      }}
                      className="block mt-1 text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
                    >
                      <PencilSimpleIcon size={12} weight="bold" className="inline mr-0.5" />
                      Atribuir
                    </button>
                  )}
                </>
              )
            }
          />
          <InfoCard
            icon={<MapPin size={16} />}
            label="Rota"
            value={
              <>
                {trip.origin} → {trip.destiny}
                <br />
                <span className="text-muted-foreground">{trip.departure_time} → {trip.arrival_time}</span>
              </>
            }
          />
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Ocupação
            </p>
            <p className="text-sm font-medium">
              {trip.active_reservations} / {trip.seating_capacity} vagas
            </p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${occupancy}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Check size={12} weight="bold" className="text-green-600" />
              {trip.checked_in_count} check-ins
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} />
              {trip.passengers.length} passageiros
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Passageiros ({trip.passengers.length})
              </h2>
            </div>
            <div className="no-print">
            {trip.status === 'CONCLUÍDA' ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <DownloadSimple size={14} weight="bold" className="mr-1" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => downloadExport(trip.id, 'csv')}>
                      <DownloadSimple size={14} className="mr-2" />
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadExport(trip.id, 'xlsx')}>
                      <DownloadSimple size={14} className="mr-2" />
                      Exportar Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer size={14} weight="bold" className="mr-1" />
                  Imprimir
                </Button>
              </div>
            ) : trip.status !== 'CANCELADA' && (
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <UserPlus size={14} weight="bold" className="mr-1" />
                Adicionar
              </Button>
            )}
            </div>
          </div>

          {trip.passengers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
              <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" weight="light" />
              <p className="text-sm text-muted-foreground">Nenhum passageiro nesta viagem.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[50px_1fr_100px_100px_80px_50px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
                <span>ID</span>
                <span>Passageiro</span>
                <span>Documento</span>
                <span>Status</span>
                <span className="text-center">Check-in</span>
                <span />
              </div>
              <div className="divide-y divide-border/50">
                {trip.passengers.map((p) => {
                  const showLink = !!(p.profile_id && (p.passenger_type === 'ESTUDANTE' || p.passenger_type === 'SERVIDOR'))
                  const linkTarget = p.passenger_type === 'ESTUDANTE' ? '/admin/estudantes/$id' : '/admin/servidores/$id'

                  return (
                    <Fragment key={`${p.passenger_type}-${p.id}`}>
                      {showLink ? (
                        <Link
                          to={linkTarget}
                          params={{ id: String(p.profile_id) }}
                          className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[50px_1fr_100px_100px_80px_50px] md:items-center"
                        >
                          <span className="font-mono text-xs text-muted-foreground truncate">{p.id}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{p.passenger_name}</span>
                            {passengerBadge(p.passenger_type)}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {p.passenger_id_display ?? '—'}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block w-fit ${
                            p.reservation_status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            p.reservation_status === 'CONFIRMADA' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {p.reservation_status === 'LISTA SECUNDÁRIA' ? 'Lista Sec.' : p.reservation_status}
                          </span>
                          <span className="flex justify-center">
                            {p.check_in ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                <Check size={12} weight="bold" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                <X size={12} weight="bold" />
                              </span>
                            )}
                          </span>
                          <span />
                        </Link>
                      ) : (
                        <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[50px_1fr_100px_100px_80px_50px] md:items-center">
                          <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{p.passenger_name}</span>
                            {passengerBadge(p.passenger_type)}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {p.passenger_id_display ?? '—'}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block w-fit ${
                            p.reservation_status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            p.reservation_status === 'CONFIRMADA' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {p.reservation_status === 'LISTA SECUNDÁRIA' ? 'Lista Sec.' : p.reservation_status}
                          </span>
                          <span className="flex justify-center">
                            {p.check_in ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                <Check size={12} weight="bold" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                <X size={12} weight="bold" />
                              </span>
                            )}
                          </span>
                          <span />
                        </div>
                      )}
                    </Fragment>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="no-print">
        <AddPassengerModal tripId={trip.id} open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </AdminLayout>
  )
}
