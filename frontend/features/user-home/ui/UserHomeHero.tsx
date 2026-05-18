import { Button } from '@ui/button'

type UserHomeHeroProps = {
  fullName?: string | null
  profileType?: string | null
  email?: string | null
  totalTrips: number
}

function UserHomeMetricCard({
  label,
  value,
  description,
  className,
  labelClassName,
  valueClassName,
}: {
  label: string
  value: string | number
  description: string
  className: string
  labelClassName: string
  valueClassName: string
}) {
  return (
    <div className={className}>
      <p className={labelClassName}>
        {label}
      </p>
      <div className="mt-3 space-y-2">
        <p className={valueClassName}>{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function UserHomeHero({
  fullName,
  profileType,
  email,
  totalTrips,
}: UserHomeHeroProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-4xl border border-border/70 bg-card shadow-sm">
      <div className="grid gap-8 p-6 lg:grid-cols-[1.35fr_0.85fr] lg:p-8">
        <div className="space-y-4">
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Painel do usuário
          </span>

          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {fullName || 'Bem-vindo(a) ao EasyRota'}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Acompanhe sua próxima viagem, veja o histórico recente e acesse as
              rotas disponíveis sem sair do conceito da plataforma: confirmação,
              quorum e embarque organizado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/app/current-trip">Ver viagem atual</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/app/viagens">Ver todas as viagens</a>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <UserHomeMetricCard
            label="Perfil"
            value={profileType || 'PASSAGEIRO'}
            description={email || 'Conta autenticada na plataforma'}
            className="rounded-3xl bg-muted/40 p-5 ring-1 ring-border/70"
            labelClassName="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
            valueClassName="text-lg font-semibold"
          />

          <UserHomeMetricCard
            label="Reservas totais"
            value={totalTrips}
            description="Registros recuperados do histórico da sua conta."
            className="rounded-3xl bg-primary/5 p-5 ring-1 ring-primary/10"
            labelClassName="text-xs font-semibold tracking-[0.2em] text-primary uppercase"
            valueClassName="text-3xl font-semibold tracking-tight"
          />
        </div>
      </div>
    </div>
  )
}
