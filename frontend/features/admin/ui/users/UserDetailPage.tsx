import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check, X, Minus, GraduationCap, UserCircleCheck } from "@phosphor-icons/react"
import { AdminLayout } from '@/features/admin/ui/Layout'
import { useUserDetail } from '@/features/admin/hooks/useUserDetail'
import { STATUS_CONFIG } from '@/features/admin/ui/routes/StatusBadge'

const PROFILE_LABELS: Record<string, string> = {
  STUDENT: 'Estudante',
  'CIVIL-SERVANT': 'Servidor',
}

const PROFILE_ICONS: Record<string, typeof GraduationCap> = {
  STUDENT: GraduationCap,
  'CIVIL-SERVANT': UserCircleCheck,
}

const STATUS_STYLES: Record<string, string> = {
  RISCO_DE_CANCELAMENTO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CANCELADA: 'bg-red-100 text-red-800 border-red-200',
  CONFIRMADA: 'bg-blue-100 text-blue-800 border-blue-200',
  EM_ANDAMENTO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CONCLUÍDA: 'bg-green-100 text-green-800 border-green-200',
}

interface Props {
  profileType: 'STUDENT' | 'CIVIL-SERVANT'
  profileId: string
}

export function UserDetailPage({ profileType, profileId }: Props) {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useUserDetail(profileType, profileId)

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Carregando dados do usuário...
          </div>
        </section>
      </AdminLayout>
    )
  }

  if (isError || !data) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Erro ao carregar dados do usuário.
          </div>
        </section>
      </AdminLayout>
    )
  }

  const { user, profile, stats, trips } = data
  const ProfileIcon = PROFILE_ICONS[user.profile_type]

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-8">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Voltar para {profileType === 'STUDENT' ? 'Estudantes' : 'Servidores'}
        </button>

        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ProfileIcon size={28} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {user.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-card text-muted-foreground border-border">
                {PROFILE_LABELS[user.profile_type]}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                user.is_active
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {user.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total_trips}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total de Viagens</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total_absences}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total de Faltas</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total_reservations - stats.total_absences}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Check-ins Realizados</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${stats.attendance_rate >= 80 ? 'text-green-600' : stats.attendance_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.attendance_rate}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Taxa de Presença</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase mb-3">Informações Pessoais</h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                {profileType === 'STUDENT' ? 'Matrícula' : 'Matrícula ODS'}
              </span>
              <span className="text-sm font-medium font-mono">
                {profile.student_id || profile.civil_servant_id}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Cadastro em</span>
              <span className="text-sm font-medium">
                {new Date(user.date_joined).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase mb-3">Histórico de Viagens</h2>
          {trips.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
              Nenhuma viagem encontrada.
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[60px_120px_70px_1fr_100px_100px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
                <span>ID</span>
                <span>Data</span>
                <span>Horário</span>
                <span>Rota</span>
                <span>Status</span>
                <span className="text-center">Presença</span>
              </div>
              <div className="divide-y divide-border/50">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[60px_120px_70px_1fr_100px_100px] md:items-center"
                  >
                    <span
                      className="font-mono text-xs text-muted-foreground underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 cursor-pointer"
                      onClick={() => navigate({ to: '/admin/viagens/$id', params: { id: String(trip.id) } })}
                    >
                      {trip.id}
                    </span>
                    <span className="font-medium">{new Date(trip.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className="font-mono text-xs text-muted-foreground">{trip.departure_time.slice(0, 5)}</span>
                    <span className="text-muted-foreground text-xs md:text-sm truncate">{trip.route}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block w-fit ${STATUS_STYLES[trip.status.replace(/ /g, '_')] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {STATUS_CONFIG[trip.status as keyof typeof STATUS_CONFIG]?.label || trip.status}
                    </span>
                    <span className="flex justify-center">
                      {trip.status === 'CANCELADA' ? (
                        <Minus size={16} className="text-muted-foreground/50" />
                      ) : trip.checked_in ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <Check size={12} weight="bold" />
                          Presente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <X size={12} weight="bold" />
                          Ausente
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  )
}
