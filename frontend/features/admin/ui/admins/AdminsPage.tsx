import { useState, useMemo } from 'react'
import { AdminLayout } from '@/features/admin/ui/Layout'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'
import { ConfirmDeleteDialog } from '@ui/delete-alert'
import { MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, TrashIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import { useAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin } from '../../hooks/useAdmins'
import type { Admin, CreateAdminPayload, UpdateAdminPayload } from '../../services/admins'

const LEVEL_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  subadmin: 'Subadmin',
}

function AdminForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Admin
  onSuccess: () => void
  onCancel: () => void
}) {
  const createMutation = useCreateAdmin()
  const updateMutation = useUpdateAdmin()
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPasswordChange, setShowPasswordChange] = useState(!initial)
  const [role, setRole] = useState(initial?.role ?? '')
  const [level, setLevel] = useState<"superadmin" | "subadmin">(initial?.level ?? 'subadmin')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (initial) {
      const payload: UpdateAdminPayload = {}
      if (fullName !== initial.full_name) payload.full_name = fullName
      if (email !== initial.email) payload.email = email
      if (showPasswordChange && password) {
        if (password !== passwordConfirmation) {
          setError('As senhas não conferem.')
          return
        }
        payload.password = password
      }
      if (role !== initial.role) payload.role = role
      if (level !== initial.level) payload.level = level
      if (Object.keys(payload).length === 0) { onSuccess(); return }
      updateMutation.mutate(
        { userId: initial.user_id, data: payload },
        { onSuccess, onError: (err: any) => setError(err?.data?.email?.[0] ?? err?.data?.detail ?? 'Erro ao atualizar') },
      )
    } else {
      if (!fullName || !email || !password || !role) {
        setError('Preencha todos os campos obrigatórios.')
        return
      }
      if (password !== passwordConfirmation) {
        setError('As senhas não conferem.')
        return
      }
      const payload: CreateAdminPayload = { full_name: fullName, email, password, role }
      createMutation.mutate(payload, {
        onSuccess,
        onError: (err: any) => setError(err?.data?.email?.[0] ?? err?.data?.detail ?? 'Erro ao criar'),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          required={!initial}
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          required={!initial}
        />
      </div>
      {initial && !showPasswordChange && (
        <div>
          <button
            type="button"
            onClick={() => setShowPasswordChange(true)}
            className="text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer"
          >
            Alterar senha
          </button>
        </div>
      )}
      {showPasswordChange && (
        <>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{initial ? 'Nova senha' : 'Senha'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              required={!initial}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{initial ? 'Confirmar nova senha' : 'Confirmar senha'}</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              required={!initial}
            />
          </div>
          {initial && (
            <button
              type="button"
              onClick={() => { setShowPasswordChange(false); setPassword(''); setPasswordConfirmation('') }}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancelar alteração de senha
            </button>
          )}
        </>
      )}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Cargo</label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Ex: Secretário, Administrador..."
          className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          required={!initial}
        />
      </div>
      {initial && (
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nível</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as "superadmin" | "subadmin")}
            className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="subadmin">Subadmin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending} className="cursor-pointer">
          {initial ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  )
}

export function AdminsPage() {
  const [search, setSearch] = useState('')
  const { data: admins, isLoading, error } = useAdmins(search || undefined)
  const deleteMutation = useDeleteAdmin()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)

  const sortedAdmins = useMemo(() => {
    if (!admins) return []
    return [...admins].sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [admins])

  function openEdit(admin: Admin) {
    setEditingAdmin(admin)
    setIsEditOpen(true)
  }

  function handleDelete(admin: Admin) {
    deleteMutation.mutate(admin.user_id)
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Frota e Pessoal
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Administradores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os administradores do sistema.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 mt-1.5 cursor-pointer">
                <PlusIcon className="mr-2" weight="bold" size={20} />
                Novo administrador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo administrador</DialogTitle>
              </DialogHeader>
              <AdminForm onSuccess={() => setIsCreateOpen(false)} onCancel={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex items-end gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
            <div className="relative">
              <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-60 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          {!isLoading && !error && (
            <span className="text-xs text-muted-foreground mb-0.5">
              {sortedAdmins.length} {sortedAdmins.length === 1 ? 'administrador' : 'administradores'}
            </span>
          )}
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar os administradores.
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Carregando administradores...
          </div>
        ) : !error && sortedAdmins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <ShieldCheckIcon size={48} className="mx-auto text-muted-foreground/40 mb-4" weight="light" />
            <p className="text-sm text-muted-foreground">
              {search ? 'Nenhum administrador corresponde à busca.' : 'Nenhum administrador cadastrado.'}
            </p>
          </div>
        ) : !error && sortedAdmins.length > 0 ? (
          <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_140px_80px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
              <span>Nome</span>
              <span>Email</span>
              <span>Nível</span>
              <span>Criado por</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border/50">
              {sortedAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-2 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[1fr_1fr_100px_140px_80px] md:items-center"
                >
                  <span className="font-medium truncate leading-tight">{admin.full_name}</span>
                  <span className="text-muted-foreground text-xs md:text-sm md:text-foreground truncate">{admin.email}</span>
                  <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide w-fit ${
                    admin.level === 'superadmin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {LEVEL_LABELS[admin.level]}
                  </span>
                  <span className="text-muted-foreground text-xs truncate">{admin.created_by_name ?? '—'}</span>
                  <div className="flex items-center gap-1 justify-end -mr-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 h-auto text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => openEdit(admin)}
                    >
                      <PencilSimpleIcon size={15} />
                    </Button>
                    <ConfirmDeleteDialog
                      onConfirm={() => handleDelete(admin)}
                      trigger={
                        <Button variant="ghost" size="sm" className="p-1.5 h-auto text-muted-foreground hover:text-destructive cursor-pointer">
                          <TrashIcon size={15} />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setIsEditOpen(false); setEditingAdmin(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar administrador</DialogTitle>
          </DialogHeader>
          {editingAdmin && (
            <AdminForm
              initial={editingAdmin}
              onSuccess={() => { setIsEditOpen(false); setEditingAdmin(null) }}
              onCancel={() => { setIsEditOpen(false); setEditingAdmin(null) }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
