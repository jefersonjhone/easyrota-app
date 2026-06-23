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
import { MagnifyingGlassIcon, PlusIcon, PencilSimpleIcon, TrashIcon, GraduationCap } from "@phosphor-icons/react"

import { AdminLayout } from '@/features/admin/ui/Layout'
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/features/admin/hooks/useStudents'
import type { Student } from '@/features/admin/services/students'

const createSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  student_id: z.string().min(1, "Matrícula é obrigatória."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().min(1, "Senha é obrigatória."),
  passwordConfirmation: z.string().min(1, "Confirmação de senha é obrigatória."),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Senhas não conferem.",
  path: ["passwordConfirmation"],
})

const updateSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  student_id: z.string().min(1, "Matrícula é obrigatória."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().optional(),
  passwordConfirmation: z.string().optional(),
}).refine((data) => !data.password || data.password === data.passwordConfirmation, {
  message: "Senhas não conferem.",
  path: ["passwordConfirmation"],
})

type CreateData = z.infer<typeof createSchema>
type UpdateData = z.infer<typeof updateSchema>

export function EstudantesPage() {

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
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

  const {
    data: students = [],
    isLoading,
    isError,
  } = useStudents(search)

  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent()
  const deleteMutation = useDeleteStudent()

  const onCreateSubmit = (data: CreateData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        createForm.reset({ full_name: "", student_id: "", email: "", password: "", passwordConfirmation: "" })
        setIsAddOpen(false)
      },
      onError: (error) => {
        const err = error as { data?: Record<string, string | string[]>; response?: { data?: Record<string, string | string[]> } }
        const errorData = err.data || err.response?.data
        if (errorData) {
          if (errorData.student_id) {
            const msg = Array.isArray(errorData.student_id) ? errorData.student_id[0] : errorData.student_id
            createForm.setError("student_id", { type: "server", message: msg })
          }
          if (errorData.email) {
            const msg = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
            createForm.setError("email", { type: "server", message: msg })
          }
        }
      },
    })
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setEditPasswordOpen(false)
    editForm.reset({
      full_name: student.full_name,
      student_id: student.student_id,
      email: student.email,
      password: "",
      passwordConfirmation: "",
    })
    setIsEditOpen(true)
  }

  const onEditSubmit = (data: UpdateData) => {
    if (!editingStudent) return
    const payload = { ...data }
    if (!payload.password) {
      delete payload.password
      delete payload.passwordConfirmation
    }
    updateMutation.mutate({ id: editingStudent.id, data: payload }, {
      onSuccess: () => {
        editForm.reset({ full_name: "", student_id: "", email: "", password: "", passwordConfirmation: "" })
        setEditingStudent(null)
        setIsEditOpen(false)
      },
      onError: (error) => {
        const err = error as { data?: Record<string, string | string[]>; response?: { data?: Record<string, string | string[]> } }
        const errorData = err.data || err.response?.data
        if (errorData) {
          if (errorData.student_id) {
            const msg = Array.isArray(errorData.student_id) ? errorData.student_id[0] : errorData.student_id
            editForm.setError("student_id", { type: "server", message: msg })
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
            <h1 className="font-heading text-3xl font-semibold tracking-tight mt-1">
              Estudantes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os estudantes cadastrados no sistema.
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 mt-1.5 cursor-pointer">
                <PlusIcon className="mr-2" weight="bold" size={20} />
                Novo estudante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo estudante</DialogTitle>
              </DialogHeader>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome completo</Label>
                  <Input {...createForm.register("full_name")} placeholder="Nome do estudante" className="h-8 text-xs" />
                  {createForm.formState.errors.full_name && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Matrícula</Label>
                  <Input {...createForm.register("student_id")} placeholder="Número de matrícula" className="h-8 text-xs" />
                  {createForm.formState.errors.student_id && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.student_id.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email</Label>
                  <Input {...createForm.register("email")} type="email" placeholder="email@exemplo.com" className="h-8 text-xs" />
                  {createForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Senha</Label>
                  <Input {...createForm.register("password")} type="password" placeholder="Senha" className="h-8 text-xs" />
                  {createForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Confirmar senha</Label>
                  <Input {...createForm.register("passwordConfirmation")} type="password" placeholder="Confirmar senha" className="h-8 text-xs" />
                  {createForm.formState.errors.passwordConfirmation && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.passwordConfirmation.message}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="cursor-pointer">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={createMutation.isPending} className="cursor-pointer">
                    {createMutation.isPending ? 'Criando...' : 'Criar'}
                  </Button>
                </div>
              </form>
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
                placeholder="Nome ou matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-60 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          {!isLoading && !isError && (
            <span className="text-xs text-muted-foreground mb-0.5">
              {students.length} {students.length === 1 ? 'estudante' : 'estudantes'}
            </span>
          )}
        </div>

        {isError ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar os estudantes.
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Carregando estudantes...
          </div>
        ) : !isError && students.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <GraduationCap size={48} className="mx-auto text-muted-foreground/40 mb-4" weight="light" />
            <p className="text-sm text-muted-foreground">
              {search ? 'Nenhum estudante corresponde à busca.' : 'Nenhum estudante cadastrado.'}
            </p>
          </div>
        ) : !isError && students.length > 0 ? (
          <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1fr_120px_1fr_80px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
              <span>Nome</span>
              <span>Matrícula</span>
              <span>Email</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border/50">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-2 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[1fr_120px_1fr_80px] md:items-center"
                >
                  <span className="font-medium truncate">{student.full_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{student.student_id}</span>
                  <span className="text-muted-foreground text-xs md:text-sm truncate">{student.email}</span>
                  <div className="flex items-center gap-1 justify-end -mr-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 h-auto text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => handleEdit(student)}
                    >
                      <PencilSimpleIcon size={15} />
                    </Button>
                    <ConfirmDeleteDialog
                      onConfirm={() => deleteMutation.mutate(student.id)}
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

      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setIsEditOpen(false); setEditingStudent(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar estudante</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome completo</Label>
                <Input {...editForm.register("full_name")} placeholder="Nome do estudante" className="h-8 text-xs" />
                {editForm.formState.errors.full_name && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Matrícula</Label>
                <Input {...editForm.register("student_id")} placeholder="Número de matrícula" className="h-8 text-xs" />
                {editForm.formState.errors.student_id && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.student_id.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email</Label>
                <Input {...editForm.register("email")} type="email" placeholder="email@exemplo.com" className="h-8 text-xs" />
                {editForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.email.message}</p>
                )}
              </div>
              {editPasswordOpen ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nova senha</Label>
                    <Input {...editForm.register("password")} type="password" placeholder="Nova senha" className="h-8 text-xs" />
                    {editForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{editForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Confirmar nova senha</Label>
                    <Input {...editForm.register("passwordConfirmation")} type="password" placeholder="Confirmar nova senha" className="h-8 text-xs" />
                    {editForm.formState.errors.passwordConfirmation && (
                      <p className="text-xs text-destructive">{editForm.formState.errors.passwordConfirmation.message}</p>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditPasswordOpen(false)} className="cursor-pointer">
                    Cancelar alteração
                  </Button>
                </>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditPasswordOpen(true)} className="cursor-pointer">
                  Alterar senha
                </Button>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} className="cursor-pointer">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending} className="cursor-pointer">
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
