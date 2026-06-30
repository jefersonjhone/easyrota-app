import { useLogoutMutation } from '@/features/auth/hooks/useLogout'
import { useDeleteAccountMutation } from '@/features/auth/hooks/useDeleteAccount'
import { useEffect, useState } from 'react'
import { Input } from '@/lib/ui/input'

import { formatTripDate } from '../config'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/avatar"
import {
  CalendarBlank,
  IdentificationBadge,
  UserSquare,
  Gear,
} from "@phosphor-icons/react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/lib/ui/dialog'
import { Switch } from '@/lib/ui/switch'

import { Button } from '@/lib/ui/button'
import { Field, FieldGroup, FieldLabel } from "@/lib/ui/field"
import { getCurrentPushSubscription, subscribeUserToPush, unsubscribeUserFromPush } from '@/lib/push-notifications'


import type { ProfileUser } from "@/features/user-home/types"


const get_initials = (name: string) => {
  const initials = name.split(' ')
  if (initials.length === 1) {
    return name.length > 1 ? name.slice(0, 2).toUpperCase() : `${name[0]}${name[0]}`.toUpperCase()
  }
  return initials.map(n => n[0]).join('').toUpperCase()
}

const role_Label = (role_name : string) => {
  switch (role_name) {
    case "STUDENT":
      return "Estudante"
    case "DRIVER":
      return "Motorista"
    case "ADMIN":
      return "Administrador"
    case "CIVIL-SERVANT":
      return "Funcionário Público"
    default:
      return "Passageiro"
  }
}

export default function ProfileHeader({ user }: { user: ProfileUser }) {
  
  const logoutMutation = useLogoutMutation()
  const deleteAccountMutation = useDeleteAccountMutation()
  
  const [openSettings, setOpenSettings] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const canDeleteAccount =
    user.profile_type === "STUDENT" ||
    user.profile_type === "CIVIL-SERVANT"

  useEffect(() => {
    let cancelled = false

    getCurrentPushSubscription()
      .then((subscription) => {
        if (!cancelled) {
          setPushEnabled(Boolean(subscription))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPushEnabled(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handlePushToggle = async (enabled: boolean) => {
    setPushLoading(true)
    setPushEnabled(enabled)

    try {
      const success = enabled
        ? await subscribeUserToPush()
        : await unsubscribeUserFromPush()

      if (!success) {
        setPushEnabled(!enabled)
      }
    } catch {
      setPushEnabled(!enabled)
    } finally {
      setPushLoading(false)
    }
  }

  
  return (
    <header className='w-full mb-6 md:mb-8'>
      <div className="overflow-hidden rounded-4xl border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 md:gap-8 p-4 md:p-6 lg:p-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="flex items-start gap-3 md:gap-5">
            <Avatar className='w-14 h-14 md:w-20 md:h-20 shrink-0'>
              <AvatarImage src='/avatar.png' alt={user.full_name} />
              <AvatarFallback className="text-base md:text-2xl font-bold text-muted-foreground bg-muted">
                {get_initials(user.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 md:space-y-3 min-w-0">
              <div className="space-y-1 md:space-y-2">
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                  Perfil
                </span>
                <h1 className="font-heading text-lg md:text-2xl font-semibold tracking-tight break-words">
                  {user.full_name}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="space-y-1 md:space-y-1.5 text-[11px] md:text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5 md:gap-2">
                  <UserSquare size={14} className="shrink-0 md:size-[16px]" />
                  <span>{role_Label(user.profile_type)}</span>
                </p>
                <p className="flex items-center gap-1.5 md:gap-2">
                  <IdentificationBadge size={14} className="shrink-0 md:size-[16px]" />
                  <span>Matrícula: {user.student_id ?? user.civil_servant_id}</span>
                </p>
                <p className="flex items-center gap-1.5 md:gap-2">
                  <CalendarBlank size={14} className="shrink-0 md:size-[16px]" />
                  <span>Ingressou em {formatTripDate(user.joined_at)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-end lg:justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpenSettings(true)}>
              <Gear size={14} className="md:size-[16px]" />
              Configurações
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="max-h-[80vh] flex flex-col w-full max-w-lg p-0 overflow-hidden">
          <div className="px-8 pt-8 pb-3 shrink-0">
            <DialogTitle className="pr-6 text-xl">Configurações</DialogTitle>
            <DialogDescription className="mt-1.5">
              Gerencie preferências de notificações, aparência e conta.
            </DialogDescription>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 px-8 pb-2 mb-6 space-y-6">
            <section className="space-y-4">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Notificações
              </h2>

              <FieldGroup className="space-y-3">
                <Field orientation="horizontal">
                  <Switch
                    id="email-notifications"
                    name="email-notifications"
                  />
                  <FieldLabel htmlFor="email-notifications">
                    Receber notificações por email
                  </FieldLabel>
                </Field>

                <Field orientation="horizontal">
                  <Switch
                    id="push-notifications"
                    name="push-notifications"
                    checked={pushEnabled}
                    disabled={pushLoading}
                    onCheckedChange={handlePushToggle}
                  />
                  <FieldLabel htmlFor="push-notifications">
                    Receber notificações push
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Conta
              </h2>

              {!confirmingDelete ? (
                <div className="flex flex-col gap-4">
                  <Button variant="ghost" className="justify-start px-0 text-sm font-medium hover:underline">
                    Alterar email
                  </Button>

                  <Button variant="ghost" className="justify-start px-0 text-sm font-medium hover:underline">
                    Alterar nome
                  </Button>

                  <Button variant="ghost" className="justify-start px-0 text-sm font-medium hover:underline">
                    Alterar senha
                  </Button>

                  {canDeleteAccount && (
                    <Button
                      variant="ghost"
                      className="justify-start px-0 text-sm font-medium text-destructive hover:underline"
                      onClick={() => {
                        setConfirmingDelete(true)
                        setConfirmPassword("")
                        deleteAccountMutation.reset()
                      }}
                    >
                      Solicitar exclusão da conta
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="justify-start px-0 text-sm font-medium hover:underline"
                    onClick={() => logoutMutation.mutate()}
                  >
                    Sair da conta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 rounded-4xl border border-border/70 bg-muted/20 p-6">
                  <div>
                    <h3 className="text-lg font-semibold">Solicitação de exclusão da conta</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Essa ação desativará sua conta imediatamente. Alguns dados poderão ser mantidos
                      temporariamente para cumprimento de obrigações legais e auditoria, conforme a LGPD.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Você pode cancelar a solicitação de exclusão em até 30 dias, basta logar novamente
                      em sua conta.
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Para confirmar, digite sua senha.
                    </p>
                  </div>

                  <Input
                    name="confirm-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  {deleteAccountMutation.isError && (
                    <p className="text-sm text-destructive">Senha incorreta.</p>
                  )}

                  <div className="flex justify-end gap-2">
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

                    <Button
                      variant="destructive"
                      disabled={deleteAccountMutation.isPending}
                      onClick={() => deleteAccountMutation.mutate(confirmPassword)}
                    >
                      {deleteAccountMutation.isPending ? "Excluindo..." : "Excluir conta"}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
