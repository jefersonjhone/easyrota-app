import { useParams, useNavigate } from '@tanstack/react-router'
import { useDriverAdminDetail } from '@/features/admin/hooks/useDriverAdminDetail'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { STATUS_CONFIG } from '@/features/admin/ui/routes/StatusBadge'
import { ArrowLeft, User } from '@phosphor-icons/react'

export function DriverDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/admin/motoristas/$id' })
  const { data: driver, isLoading, error } = useDriverAdminDetail(Number(id))

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Carregando motorista...
          </div>
        </section>
      </AdminLayout>
    )
  }

  if (error || !driver) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Motorista não encontrado.
          </div>
        </section>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-8">
        <button
          type="button"
          onClick={() => navigate({ to: '/admin/motoristas' })}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Voltar para Motoristas
        </button>

        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size={28} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {driver.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                driver.is_active
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {driver.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{driver.trip_count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total de Viagens</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase mb-3">Informações Pessoais</h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{driver.email}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">CNH</span>
              <span className="text-sm font-medium font-mono">{driver.cnh}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Cadastro em</span>
              <span className="text-sm font-medium">
                {new Date(driver.date_joined).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase mb-3">Histórico de Viagens</h2>
          {driver.recent_trips.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
              Nenhuma viagem registrada para este motorista.
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[70px_1fr_120px_120px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
                <span>Horário</span>
                <span>Rota</span>
                <span>Data</span>
                <span className="text-center">Status</span>
              </div>
              <div className="divide-y divide-border/50">
                {driver.recent_trips.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[70px_1fr_120px_120px] md:items-center"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{t.departure_time}</span>
                    <span
                      className="font-medium underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 cursor-pointer"
                      onClick={() => navigate({ to: '/admin/viagens/$id', params: { id: String(t.id) } })}
                    >
                      {t.origin} → {t.destiny}
                    </span>
                    <span className="text-muted-foreground text-xs">{new Date(t.trip_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block w-fit text-center justify-self-center ${STATUS_CONFIG[t.status].className}`}>
                      {STATUS_CONFIG[t.status].label}
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
