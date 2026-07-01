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
      <div className="mt-2 md:mt-3 space-y-1 md:space-y-2">
        <p className={valueClassName}>{value}</p>
        <p className="text-[11px] md:text-sm leading-snug text-muted-foreground">{description}</p>
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
  const roleLabel: string = {
    STUDENT: 'Estudante',
    DRIVER: 'Motorista',
    ADMIN: 'Administrador',
    'CIVIL-SERVANT': 'Funcionário Público',
  }[profileType ?? ''] || 'Passageiro'

  return (
    <div className="mb-6 md:mb-8 overflow-hidden rounded-4xl border border-border/70 bg-card shadow-sm">
      <div className="grid gap-6 p-4 md:p-6 lg:p-8 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-3 md:space-y-4">
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Painel do usuário
          </span>

          <div className="space-y-2 md:space-y-3">
            <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
              {fullName || 'Bem-vindo(a) ao EasyRota'}
            </h1>
            <p className="max-w-2xl text-xs md:text-sm lg:text-base leading-relaxed text-muted-foreground">
              Acompanhe sua próxima viagem, veja o histórico recente e acesse as
              rotas disponíveis sem sair do conceito da plataforma: confirmação,
              quorum e embarque organizado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button asChild size="sm" className="md:default">
              <a href="/app/reservas">Ver reservas ativas</a>
            </Button>
            <Button asChild variant="outline" size="sm" className="md:default">
              <a href="/app/viagens">Ver todas as viagens</a>
            </Button>
          </div>
     
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-1">
          <UserHomeMetricCard
            label="Perfil"
            value={roleLabel || 'Passageiro'}
            description={email || 'Conta autenticada na plataforma'}
            className="rounded-3xl bg-muted/40 p-3 md:p-5 ring-1 ring-border/70"
            labelClassName="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
            valueClassName="text-sm md:text-lg font-semibold"
          />

          <UserHomeMetricCard
            label="Reservas totais"
            value={totalTrips}
            description="Registros recuperados do histórico da sua conta."
            className="rounded-3xl bg-primary/5 p-3 md:p-5 ring-1 ring-primary/10"
            labelClassName="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase"
            valueClassName="text-lg md:text-3xl font-semibold tracking-tight"
          />
        </div>
      </div>
      </div>
  )
}
