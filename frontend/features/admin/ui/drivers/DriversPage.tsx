import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from '@tanstack/react-router'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import { Label } from "@/lib/ui/label"
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/lib/ui/dialog"
import { MagnifyingGlassIcon, PlusIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react"

import { apiFetch } from '@/lib/api'
import { AdminLayout } from '@/features/admin/ui/Layout'

const createDriverSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  cnh: z.string().length(11, "CNH deve ter 11 números.")
    .regex(/^\d+$/, "CNH deve conter apenas números."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().min(1, "Senha é obrigatória."),
  passwordConfirmation: z.string().min(1, "Confirmação de senha é obrigatória."),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Senhas não conferem.",
  path: ["passwordConfirmation"],
})

const updateDriverSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  cnh: z.string().length(11, "CNH deve ter 11 números.")
    .regex(/^\d+$/, "CNH deve conter apenas números."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().optional(),
  passwordConfirmation: z.string().optional(),
}).refine((data) => !data.password || data.password === data.passwordConfirmation, {
  message: "Senhas não conferem.",
  path: ["passwordConfirmation"],
})

type CreateDriverData = z.infer<typeof createDriverSchema>
type UpdateDriverData = z.infer<typeof updateDriverSchema>

interface Driver extends UpdateDriverData {
  id: string
}

export function ManageDriversPage() {
  const queryClient = useQueryClient()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [search, setSearch] = useState('')
  const [editPasswordOpen, setEditPasswordOpen] = useState(false)

  const createForm = useForm<CreateDriverData>({
    resolver: zodResolver(createDriverSchema),
    mode: "onChange",
  })

  const editForm = useForm<UpdateDriverData>({
    resolver: zodResolver(updateDriverSchema),
    mode: "onChange",
  })

  const {
    data: drivers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['drivers', search],
    queryFn: async () => {
      const qs = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''
      return apiFetch<Driver[]>(`/drivers/${qs}`)
    },
    placeholderData: (prev) => prev,
  })

  const createDriverMutation = useMutation({
    mutationFn: async (payload: CreateDriverData) => {
      return apiFetch('/drivers/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      createForm.reset({ full_name: "", cnh: "", email: "", password: "", passwordConfirmation: "" })
      setIsAddModalOpen(false)
    },
    onError: (error) => {
      const err = error as {
        data?: Record<string, string | string[]>;
        response?: { data?: Record<string, string | string[]> };
      }

      const errorData = err.data || err.response?.data

      if (errorData) {
        if (errorData.cnh) {
          const message = Array.isArray(errorData.cnh) ? errorData.cnh[0] : errorData.cnh
          createForm.setError("cnh", { type: "server", message })
        }
        if (errorData.email) {
          const message = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
          createForm.setError("email", { type: "server", message })
        }
        if (errorData.password) {
          const message = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
          createForm.setError("password", { type: "server", message })
        }
      } else {
        console.error("Erro inesperado ao criar motorista:", error)
      }
    }
  })

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateDriverData }) => {
      return apiFetch(`/drivers/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      editForm.reset({ full_name: "", cnh: "", email: "" })
      setEditingDriver(null)
      setIsEditModalOpen(false)
    },
    onError: (error) => {
      const err = error as {
        data?: Record<string, string | string[]>;
        response?: { data?: Record<string, string | string[]> };
      }

      const errorData = err.data || err.response?.data

      if (errorData) {
        if (errorData.cnh) {
          const message = Array.isArray(errorData.cnh) ? errorData.cnh[0] : errorData.cnh
          editForm.setError("cnh", { type: "server", message })
        }
        if (errorData.email) {
          const message = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
          editForm.setError("email", { type: "server", message })
        }
      } else {
        console.error("Erro inesperado ao atualizar motorista:", error)
      }
    }
  })

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/drivers/${id}/`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })

  const onSubmit = (data: CreateDriverData) => {
    createDriverMutation.mutate(data)
  }

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver)
    setEditPasswordOpen(false)
    editForm.reset({
      full_name: driver.full_name,
      cnh: driver.cnh,
      email: driver.email,
      password: "",
      passwordConfirmation: "",
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (data: UpdateDriverData) => {
    if (!editingDriver) return
    const payload = { ...data }
    if (!payload.password) {
      delete payload.password
      delete payload.passwordConfirmation
    }
    updateDriverMutation.mutate({ id: editingDriver.id, payload })
  }

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Frota e Pessoal
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Motoristas
            </h1>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-1.5" weight="bold" size={16} />
                Adicionar Motorista
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg">
              <DialogHeader>
                <DialogTitle>Novo Motorista</DialogTitle>
              </DialogHeader>
              <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome</Label>
                  <Input id="full_name" placeholder="Digite o nome" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("full_name")} />
                  {createForm.formState.errors.full_name && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cnh" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">CNH</Label>
                  <Input id="cnh" placeholder="Digite o número da CNH" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...createForm.register("cnh")} />
                  {createForm.formState.errors.cnh && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.cnh.message}</p>
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
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDriverMutation.isPending}>
                    {createDriverMutation.isPending ? 'Registrando...' : 'Registrar'}
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
                  placeholder="Nome, CPF ou email..."
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
            Carregando motoristas...
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Erro ao carregar motoristas. Verifique sua conexão e tente novamente.
          </div>
        ) : drivers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Nenhum motorista cadastrado no momento.
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[80px_1fr_160px_1fr_70px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
              <span>ID</span>
              <span>Nome</span>
              <span>CNH</span>
              <span>Email</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border/50">
              {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[80px_1fr_160px_1fr_70px] md:items-center"
                  >
                    <Link to="/admin/motoristas/$id" params={{ id: String(driver.id) }} className="font-mono text-xs  hover:text-primary/80 transition-colors">
                      {driver.id}
                    </Link>
                    <Link to="/admin/motoristas/$id" params={{ id: String(driver.id) }} className="font-medium underline hover:text-primary/80 transition-colors">
                      {driver.full_name}
                    </Link>
                    <span className="font-mono text-xs md:text-sm">{driver.cnh}</span>
                    <span className="text-muted-foreground text-xs md:text-sm truncate">{driver.email}</span>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditDriver(driver)}
                        className="inline-flex items-center justify-center p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Editar motorista"
                      >
                        <PencilSimpleIcon size={14} />
                      </button>
                      <ConfirmDeleteDialog
                        onConfirm={() => deleteDriverMutation.mutate(driver.id)}
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

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="rounded-lg">
            <DialogHeader>
              <DialogTitle>Editar Motorista</DialogTitle>
            </DialogHeader>
            {editingDriver && (
              <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome</Label>
                  <Input id="edit-name" placeholder="Digite o nome" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("full_name")} />
                  {editForm.formState.errors.full_name && (
                    <p className="text-sm text-destructive">{editForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cnh" className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">CNH</Label>
                  <Input id="edit-cnh" placeholder="Digite o número da CNH" className="h-8 rounded-md border-border bg-card px-2.5 text-xs focus-visible:ring-2" {...editForm.register("cnh")} />
                  {editForm.formState.errors.cnh && (
                    <p className="text-sm text-destructive">{editForm.formState.errors.cnh.message}</p>
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
                  <Button type="button" variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingDriver(null); setEditPasswordOpen(false) }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateDriverMutation.isPending}>
                    {updateDriverMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
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
