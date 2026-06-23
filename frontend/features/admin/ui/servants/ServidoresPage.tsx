import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import { Label } from "@/lib/ui/label"
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/lib/ui/dialog"
import { MagnifyingGlassIcon, PlusIcon, PencilSimpleIcon, TrashIcon, UserCircleCheck } from "@phosphor-icons/react"
import { useNavigate } from '@tanstack/react-router'

import { AdminLayout } from '@/features/admin/ui/Layout'
import { useCivilServants, useCreateCivilServant, useUpdateCivilServant, useDeleteCivilServant } from '@/features/admin/hooks/useCivilServants'
import type { CivilServant } from '@/features/admin/services/civil-servants'

const createSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  civil_servant_id: z.string().min(1, "Matrícula ODS é obrigatória."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().min(1, "Senha é obrigatória."),
  passwordConfirmation: z.string().min(1, "Confirmação de senha é obrigatória."),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Senhas não conferem.",
  path: ["passwordConfirmation"],
})

const updateSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  civil_servant_id: z.string().min(1, "Matrícula ODS é obrigatória."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().optional(),
  passwordConfirmation: z.string().optional(),
}).refine((data) => !data.password || data.password === data.passwordConfirmation, {
  message: "Senhas não conferem.",
  path: ["passwordConfirmation"],
})

type CreateData = z.infer<typeof createSchema>
type UpdateData = z.infer<typeof updateSchema>

export function ServidoresPage() {
  const navigate = useNavigate()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editing, setEditing] = useState<CivilServant | null>(null)
  const [search, setSearch] = useState('')
  const [editPasswordOpen, setEditPasswordOpen] = useState(false)

  const createForm = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    mode: "onChange",
  })

  const editForm = useForm<UpdateData>({
    resolver: zodResolver(updateSchema),
    mode: "onChange",
  })

  const { data: items = [], isLoading, isError } = useCivilServants(search)
  const createMutation = useCreateCivilServant()
  const updateMutation = useUpdateCivilServant()
  const deleteMutation = useDeleteCivilServant()

  const onCreateSubmit = (data: CreateData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        createForm.reset({ full_name: "", civil_servant_id: "", email: "", password: "", passwordConfirmation: "" })
        setIsAddOpen(false)
      },
      onError: (error) => {
        const err = error as { data?: Record<string, string | string[]>; response?: { data?: Record<string, string | string[]> } }
        const errorData = err.data || err.response?.data
        if (errorData) {
          if (errorData.civil_servant_id) {
            const msg = Array.isArray(errorData.civil_servant_id) ? errorData.civil_servant_id[0] : errorData.civil_servant_id
            createForm.setError("civil_servant_id", { type: "server", message: msg })
          }
          if (errorData.email) {
            const msg = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
            createForm.setError("email", { type: "server", message: msg })
          }
        }
      },
    })
  }

  const handleEdit = (item: CivilServant) => {
    setEditing(item)
    setEditPasswordOpen(false)
    editForm.reset({
      full_name: item.full_name,
      civil_servant_id: item.civil_servant_id,
      email: item.email,
      password: "",
      passwordConfirmation: "",
    })
    setIsEditOpen(true)
  }

  const onEditSubmit = (data: UpdateData) => {
    if (!editing) return
    const payload = { ...data }
    if (!payload.password) {
      delete payload.password
      delete payload.passwordConfirmation
    }
    updateMutation.mutate({ id: editing.id, data: payload }, {
      onSuccess: () => {
        editForm.reset({ full_name: "", civil_servant_id: "", email: "", password: "", passwordConfirmation: "" })
        setEditing(null)
        setIsEditOpen(false)
      },
      onError: (error) => {
        const err = error as { data?: Record<string, string | string[]>; response?: { data?: Record<string, string | string[]> } }
        const errorData = err.data || err.response?.data
        if (errorData) {
          if (errorData.civil_servant_id) {
            const msg = Array.isArray(errorData.civil_servant_id) ? errorData.civil_servant_id[0] : errorData.civil_servant_id
            editForm.setError("civil_servant_id", { type: "server", message: msg })
          }
          if (errorData.email) {
            const msg = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
            editForm.setError("email", { type: "server", message: msg })
          }
        }
      },
    })
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Usuários e Reservas
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Servidores
            </h1>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-1.5" weight="bold" size={16} />
                Adicionar Servidor
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg">
              <DialogHeader>
                <DialogTitle>Novo Servidor</DialogTitle>
              </DialogHeader>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome</Label>
                  <Input id="full_name" placeholder="Digite o nome" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("full_name")} />
                  {createForm.formState.errors.full_name && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="civil_servant_id" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Matrícula ODS</Label>
                  <Input id="civil_servant_id" placeholder="Digite a matrícula" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("civil_servant_id")} />
                  {createForm.formState.errors.civil_servant_id && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.civil_servant_id.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email</Label>
                  <Input id="email" type="email" placeholder="Digite o email" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("email")} />
                  {createForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Senha</Label>
                  <Input id="password" type="password" placeholder="Digite a senha" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("password")} />
                  {createForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirmation" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Confirmar Senha</Label>
                  <Input id="passwordConfirmation" type="password" placeholder="Confirme a senha" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("passwordConfirmation")} />
                  {createForm.formState.errors.passwordConfirmation && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.passwordConfirmation.message}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Registrando...' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        {!isLoading && !isError && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
              <div className="relative">
                <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nome, email ou matrícula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-40 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Carregando servidores...
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Erro ao carregar servidores. Verifique sua conexão e tente novamente.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <UserCircleCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" weight="light" />
            <p className="text-sm text-muted-foreground">Nenhum servidor cadastrado no momento.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[80px_1fr_160px_1fr_70px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
              <span>ID</span>
              <span>Nome</span>
              <span>Matrícula ODS</span>
              <span>Email</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[80px_1fr_160px_1fr_70px] md:items-center"
                >
                  <span
                    className="font-mono text-xs text-muted-foreground underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 cursor-pointer"
                    onClick={() => navigate({ to: '/admin/servidores/$id', params: { id: String(item.id) } })}
                  >
                    {item.id}
                  </span>
                  <span className="font-medium">{item.full_name}</span>
                  <span className="font-mono text-xs md:text-sm">{item.civil_servant_id}</span>
                  <span className="text-muted-foreground text-xs md:text-sm truncate">{item.email}</span>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center justify-center p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Editar servidor"
                    >
                      <PencilSimpleIcon size={14} />
                    </button>
                    <ConfirmDeleteDialog
                      onConfirm={() => deleteMutation.mutate(item.id)}
                      trigger={
                        <Button variant="ghost" size="sm" className="p-1.5 h-auto text-muted-foreground hover:text-destructive">
                          <TrashIcon size={14} />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="rounded-lg">
            <DialogHeader>
              <DialogTitle>Editar Servidor</DialogTitle>
            </DialogHeader>
            {editing && (
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome</Label>
                  <Input id="edit-name" placeholder="Digite o nome" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("full_name")} />
                  {editForm.formState.errors.full_name && (
                    <p className="text-sm text-destructive">{editForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-civil_servant_id" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Matrícula ODS</Label>
                  <Input id="edit-civil_servant_id" placeholder="Digite a matrícula" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("civil_servant_id")} />
                  {editForm.formState.errors.civil_servant_id && (
                    <p className="text-sm text-destructive">{editForm.formState.errors.civil_servant_id.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email</Label>
                  <Input id="edit-email" type="email" placeholder="Digite o email" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("email")} />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{editForm.formState.errors.email.message}</p>
                  )}
                </div>
                {!editPasswordOpen && (
                  <button type="button" onClick={() => setEditPasswordOpen(true)} className="text-xs font-semibold text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer">
                    Alterar senha
                  </button>
                )}
                {editPasswordOpen && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-password" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nova Senha</Label>
                      <Input id="edit-password" type="password" placeholder="Digite a nova senha" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("password")} />
                      {editForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{editForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-passwordConfirmation" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Confirmar Nova Senha</Label>
                      <Input id="edit-passwordConfirmation" type="password" placeholder="Confirme a nova senha" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("passwordConfirmation")} />
                      {editForm.formState.errors.passwordConfirmation && (
                        <p className="text-sm text-destructive">{editForm.formState.errors.passwordConfirmation.message}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => { setEditPasswordOpen(false); editForm.setValue("password", ""); editForm.setValue("passwordConfirmation", ""); editForm.clearErrors(["password", "passwordConfirmation"]); }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      Cancelar alteração de senha
                    </button>
                  </>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditing(null); setEditPasswordOpen(false) }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </AdminLayout>
  )
}
