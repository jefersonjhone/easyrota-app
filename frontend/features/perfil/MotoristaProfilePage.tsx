import { User, Envelope, IdentificationBadge, SignOut } from '@phosphor-icons/react'
import { useAuthStore } from '@/features/auth/store/auth-store'
import MotoristaLayout from '@layout/motorista-layout'
import { useLogoutMutation } from '@/features/auth/hooks/useLogout'
import { Button } from '@ui/button'

const profileTypeLabel: Record<string, string> = {
  DRIVER: 'Motorista',
  ADMIN: 'Administrador',
  STUDENT: 'Estudante',
  'CIVIL-SERVANT': 'Servidor',
}

export function MotoristaProfilePage() {
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogoutMutation()

  return (
    <MotoristaLayout>
      <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User size={40} weight="fill" />
            </span>
            <h1 className="text-2xl font-heading font-semibold text-foreground text-center">
              {user?.full_name || 'Motorista'}
            </h1>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="rounded-4xl border border-border/70 bg-card/95 px-4 md:px-6 py-4 shadow-sm">
              <div className="flex items-center gap-3 py-3">
                <Envelope size={20} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{user?.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-t border-border/50">
                <IdentificationBadge size={20} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">Perfil</p>
                  <p className="text-sm font-medium text-foreground">
                    {profileTypeLabel[user?.profile_type || ''] || user?.profile_type || '—'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <SignOut size={18} />
              {logoutMutation.isPending ? 'Saindo...' : 'Sair da conta'}
            </Button>
          </div>
        </div>
      </section>
    </MotoristaLayout>
  )
}
