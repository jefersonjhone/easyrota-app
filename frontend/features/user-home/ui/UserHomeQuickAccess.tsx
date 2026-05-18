export function UserHomeQuickAccess() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-card/95">
        <div className="border-b border-border/70 px-6 pb-5 pt-6">
          <h2 className="text-lg font-semibold">Acesso rápido</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pontos de entrada mais usados no fluxo do passageiro.
          </p>
        </div>

        <div className="grid gap-3 px-6 py-6">
          <div className="rounded-3xl bg-muted/30 p-4">
            <p className="text-sm font-semibold">Confirmar presença</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe a viagem e confirme sua participação quando ela estiver
              disponível no fluxo operacional.
            </p>
          </div>

          <div className="rounded-3xl bg-muted/30 p-4">
            <p className="text-sm font-semibold">Consultar rotas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Veja as viagens cadastradas, horários e disponibilidade.
            </p>
          </div>

          <div className="rounded-3xl bg-muted/30 p-4">
            <p className="text-sm font-semibold">Histórico de uso</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse o histórico para conferir o andamento das suas reservas.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
