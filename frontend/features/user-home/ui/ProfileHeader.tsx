import { useLogoutMutation } from '@/features/auth/hooks/useLogout'
import { useDeleteAccountMutation } from '@/features/auth/hooks/useDeleteAccount'
import { useState } from 'react'
import { Input } from '@/lib/ui/input'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/avatar"
import {
  CalendarBlankIcon,
  IdentificationBadgeIcon,
  UserSquareIcon,
} from "@phosphor-icons/react"
import { Dialog, DialogContent } from '@/lib/ui/dialog'
import { Switch } from '@/lib/ui/switch'
import { Separator } from '@/lib/ui/separator'

import { Button } from '@/lib/ui/button'
import { Field, FieldGroup, FieldLabel } from "@/lib/ui/field"


import type { ProfileUser } from "@/features/user-home/types"


const get_initials = (name: string) => {
  const initials = name.split(' ')
  if (initials.length === 1) {
    return name.length > 1 ? name.slice(0, 2).toUpperCase() : `${name[0]}${name[0]}`.toUpperCase()
  }
  return initials.map(n => n[0]).join('').toUpperCase()
}

export default function ProfileHeader({ user }: { user: ProfileUser }) {
  
  const logoutMutation = useLogoutMutation()
  const deleteAccountMutation = useDeleteAccountMutation()
  
  const [openSettings, setOpenSettings] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const canDeleteAccount =
    user.profile_type === "STUDENT" ||
    user.profile_type === "CIVIL_SERVANT"

  
  return (
    <header className='w-full'>
      <div className='w-full h-26 md:h-42 bg-linear-to-r from-slate-300 to-slate-200' />
      
      <div className='max-w-4xl mx-auto px-4 pb-4'>
        
        <div className='flex gap-4 -mt-12 md:-mt-18 justify-between '>
          <div className='shrink-0'>
            <Avatar className='w-22 h-22 md:w-32 md:h-32 border-4 md:border-6 border-white'>
              <AvatarImage src='/avatar.png' alt='João da Silva' />
              <AvatarFallback className='text-4xl font-bold '>{get_initials(user.full_name)}</AvatarFallback>
            </Avatar>
            
            <div className='flex flex-col pb-2 m-0 '>
              <h1 className='text-lg md:text-2xl font-bold '>{user.full_name}</h1>
              <p className='text-gray-500 text-base'>{user.email}</p>
              <div className="text-sm sm:text-base font-">
                <p className='text-gray-600 mt-1 md:mt-2'>
                  <UserSquareIcon className='inline-block mr-1' />
                  <span>
                    Perfil: {user.profile_type}
                  </span>
                </p>
                
                <p className='text-gray-600 '>
                  <IdentificationBadgeIcon className='inline-block mr-1' />
                  <span className="">
                    
                    Matrícula: {user.student_id ?? user.civil_servant_id}
                  </span>
                </p>
                <p className='text-gray-600'>
                  <CalendarBlankIcon className='inline-block mr-1' />
                  <span>Ingressou em {user.joined_at}</span>
                </p>
              </div>
            </div>
          </div>

          <div className='flex gap-2 items-start pt-2 mt-4 md:mt-10'>
            <button
              className='px-4 md:px-8 py-2 bg-slate-400  text-sm text-white border border-white
              rounded-full font-medium md:font-bold hover:opacity-90' 
              onClick={()=>{setOpenSettings(true)}}
            >
              Configurações
            </button>
          </div>
        </div>
      </div>
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="w-full max-w-lg space-y-6">
      
          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Notificações
            </h2>
      
            <FieldGroup className="space-y-2">
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
                />
                <FieldLabel htmlFor="push-notifications">
                  Receber notificações push
                </FieldLabel>
              </Field>
            </FieldGroup>
          </section>
      
          <Separator />
      
          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Aparência
            </h2>
      
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Tema
              </p>
            </div>
          </section>
      
          <Separator />
      
          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Acessibilidade
            </h2>
      
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Alto contraste
              </p>
      
              <p className="text-sm font-medium">
                Tamanho da fonte
              </p>
            </div>
          </section>
      
          <Separator />
      
          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Conta
            </h2>
      
            {!confirmingDelete ? (
              <div className="flex flex-col gap-3">
      
                <button className="text-left text-sm font-medium hover:underline">
                  Alterar email
                </button>
      
                <button className="text-left text-sm font-medium hover:underline">
                  Alterar nome
                </button>
      
                <button className="text-left text-sm font-medium hover:underline">
                  Alterar senha
                </button>
      
                {canDeleteAccount && (<button
                  className="text-left text-sm font-medium text-destructive hover:underline"
                  onClick={() => {
                    setConfirmingDelete(true)
                    setConfirmPassword("")
                    deleteAccountMutation.reset()
                  }}
                >
                  Solicitar exclusão da conta
                </button>)}
      
                <button
                  className="text-left text-sm font-medium hover:underline"
                  onClick={() => {
                    logoutMutation.mutate()
                  }}
                >
                  Sair da conta
                </button>
      
              </div>
            ) : (
              <div className="space-y-4 rounded-lg border p-4">
      
                <div>
                  <h3 className="text-lg font-semibold">
                    Confirmar exclusão da conta
                  </h3>
      
                  <p className="mt-2 text-sm text-muted-foreground">
                    Essa ação é permanente e não poderá ser desfeita.
                  </p>
      
                  <p className="text-sm text-muted-foreground">
                    Para confirmar, digite sua senha.
                  </p>
                </div>
      
                <Input
                  name="confirm-password"
                  type="password"
                  placeholder="Digite sua senha"
                  className="rounded-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
      
                {deleteAccountMutation.isError && (
                  <p className="text-sm text-destructive">
                    Senha incorreta.
                  </p>
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
                    onClick={() =>
                      deleteAccountMutation.mutate(confirmPassword)
                    }
                  >
                    {deleteAccountMutation.isPending
                      ? "Excluindo..."
                      : "Excluir conta"}
                  </Button>
      
                </div>
              </div>
            )}
          </section>
      
        </DialogContent>
      </Dialog>
    </header>
  )
}