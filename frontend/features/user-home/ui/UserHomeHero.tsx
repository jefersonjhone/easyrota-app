import { Button } from '@ui/button'
import { useLogoutMutation } from '@/features/auth/hooks/useLogout'
import { useDeleteAccountMutation } from '@/features/auth/hooks/useDeleteAccount'
import { useState } from 'react'
import { Input } from '@/lib/ui/input'

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
  const logoutMutation = useLogoutMutation()
  const deleteAccountMutation = useDeleteAccountMutation()

  const [openSettings, setOpenSettings] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")

  const canDeleteAccount =
    profileType === "STUDENT" ||
    profileType === "CIVIL-SERVANT"

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
              <a href="/app/viagens/atual">Ver viagem atual</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/app/viagens">Ver todas as viagens</a>
            </Button>
          </div>
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10"
           onClick={() => logoutMutation.mutate()}>
            Sair da Conta
          </Button>

          {/* Since the only configuration option so far is "delete account," administrators and drivers cannot see the settings button. */}
          {canDeleteAccount && (<Button variant="ghost" size="icon"
            onClick={() => setOpenSettings(true)}>
            ⚙️
          </Button>)}
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
      
      {/* Settings Dialog */}
      {openSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">

            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Configurações da Conta
              </p>

              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setOpenSettings(false)}>
                ✖
              </Button>

            </div>

            <div className="my-4 h-px bg-border" />

            <div className="mt-4">
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10"
              onClick={() => {
                setConfirmingDelete(true)
                setConfirmPassword("")
                deleteAccountMutation.reset()
              }}
              >
                Excluir Conta
              </Button>
            </div>

            {/* Confirm delete account dialog */}
            {confirmingDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
              <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">

                <h2 className="text-lg font-semibold">
                  Confirmar exclusão da conta
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Essa ação é permanente e não poderá ser desfeita.
                </p>
                <p className="mb-2 text-sm text-muted-foreground">
                  Para confirmar, digite a senha da sua conta.
                </p>

                <Input
                  name='confirm-password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Digite sua senha'
                  type="password">
                </Input>

                {deleteAccountMutation.isError && (
                <p className="mt-2 text-sm text-destructive">
                  Senha incorreta.
                </p>
              )}

                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfirmingDelete(false)
                      setConfirmPassword("")
                      deleteAccountMutation.reset()
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    onClick={() => deleteAccountMutation.mutate(confirmPassword)}>
                    {deleteAccountMutation.isPending
                      ? "Excluindo..."
                      : "Excluir Conta"}
                  </Button>
                </div>

              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
