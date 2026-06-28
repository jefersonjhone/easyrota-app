import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheckIcon, PencilSimpleIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { useAuthUser } from '@/features/auth/hooks/useAuthUser'
import { updateAdmin } from '@/features/admin/services/admins'
import { Button } from '@/lib/ui/button'
import { Input } from '@/lib/ui/input'
import { Label } from '@/lib/ui/label'

const LEVEL_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  moderator: 'Moderador',
  subadmin: 'Subadmin',
}

export function AdminProfilePage() {
  const navigate = useNavigate()
  const user = useAuthUser()
  const adminId = user.admin_profile?.id
  const userId = user.id

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user.full_name)
  const [email, setEmail] = useState(user.email)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  if (!adminId) {
    return (
      <AdminLayout>
        <section className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Perfil de administrador não encontrado.
          </div>
        </section>
      </AdminLayout>
    )
  }

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Preencha nome e email.')
      return
    }
    if (showPasswordChange && password !== passwordConfirmation) {
      toast.error('As senhas não conferem.')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, string> = { full_name: fullName, email }
      if (showPasswordChange && password) {
        payload.password = password
      }
      await updateAdmin(userId, payload as any)
      toast.success('Perfil atualizado com sucesso!')
      setEditing(false)
      setShowPasswordChange(false)
      setPassword('')
      setPasswordConfirmation('')
    } catch (err: any) {
      const msg = err?.data?.email?.[0] ?? err?.data?.detail ?? 'Erro ao atualizar perfil.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(user.full_name)
    setEmail(user.email)
    setShowPasswordChange(false)
    setPassword('')
    setPasswordConfirmation('')
    setEditing(false)
  }

  const adminRole = user.admin_profile?.role ?? '—'
  const adminLevel = user.admin_profile?.level ?? ''
  const levelLabel = LEVEL_LABELS[adminLevel] ?? adminLevel

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-8">
        <button
          type="button"
          onClick={() => navigate({ to: '/admin' })}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Voltar para Dashboard
        </button>

        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheckIcon size={28} />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {user.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-card text-muted-foreground border-border">
                {levelLabel}
              </span>
              {adminRole !== '—' && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-primary/5 text-primary border-primary/20">
                  {adminRole}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Informações Pessoais
            </h2>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
              >
                <PencilSimpleIcon size={13} />
                Editar
              </button>
            )}
          </div>
          <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Nome</span>
              {editing ? (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 w-56 text-xs text-right"
                />
              ) : (
                <span className="text-sm font-medium">{user.full_name}</span>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Email</span>
              {editing ? (
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-56 text-xs text-right"
                />
              ) : (
                <span className="text-sm font-medium">{user.email}</span>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Cargo</span>
              <span className="text-sm font-medium">{adminRole}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Nível</span>
              <span className="text-sm font-medium">{levelLabel}</span>
            </div>
          </div>
        </div>

        {editing && (
          <div className="space-y-4">
            {!showPasswordChange ? (
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
              >
                Alterar senha
              </button>
            ) : (
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Alterar senha
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordChange(false); setPassword(''); setPasswordConfirmation('') }}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nova senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nova senha"
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Confirmar nova senha</Label>
                  <Input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Confirmar nova senha"
                    className="h-10 text-xs"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel} className="cursor-pointer">
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
