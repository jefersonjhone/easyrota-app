import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import { Label } from "@/lib/ui/label"
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'

import { apiFetch } from '@/lib/api'
import { AdminLayout } from '@/features/admin/ui/Layout'

const createDriverSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  cnh: z.string().min(11, "CNH deve ter 11 números."),
  email: z.string().min(1, "Email é obrigatório."),
  password: z.string().min(1, "Senha é obrigatória.")
})

const updateDriverSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório."),
  cnh: z.string().min(11, "CNH deve ter 11 números."),
  email: z.string().min(1, "Email é obrigatório."),
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

  const createForm = useForm<CreateDriverData>({
    resolver: zodResolver(createDriverSchema),
    mode: "onChange",
  })

  const editForm = useForm<UpdateDriverData>({
    resolver: zodResolver(updateDriverSchema),
    mode: "onChange",
  })

  // LISTAR MOTORISTAS
  const {
    data: drivers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      return apiFetch<Driver[]>('/drivers/')
    },
  })

  // CRIAR MOTORISTA
  const createDriverMutation = useMutation({
    mutationFn: async (payload: CreateDriverData) => {
      return apiFetch('/drivers/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['drivers'],
      })

      createForm.reset({
        full_name: "",
        cnh: "",
        email: "",
        password: "",
      })
      setIsAddModalOpen(false)
    },

    onError: (error: any) => {
      if (error.data?.cnh){
        createForm.setError("cnh", {
          type: "server",
          message: "Já existe um motorista com essa CNH.",
        })
      }
      if (error.data?.email) {
        createForm.setError("email", {
          type: "server",
          message: error.data.email[0],
        })
      }
    }
  })

  // EDITAR MOTORISTA
  const updateDriverMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateDriverData
    }) => {
      return apiFetch(`/drivers/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['drivers'],
      })

      editForm.reset({
        full_name: "",
        cnh: "",
        email: "",
      })
      setEditingDriver(null)
      setIsEditModalOpen(false)
    },

    onError: (error: any) => {
      if (error.data?.cnh){
        editForm.setError("cnh", {
          type: "server",
          message: "Já existe um motorista com essa CNH.",
        })
      }
      if (error.data?.email) {
        editForm.setError("email", {
          type: "server",
          message: error.data.email[0],
        })
      }
    }
  })

  // DELETAR MOTORISTA
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/drivers/${id}/`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['drivers'],
      })
    },
  })

  const onSubmit = (data: CreateDriverData) => {
    createDriverMutation.mutate(data)
  }

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver)

    editForm.reset({
      full_name: driver.full_name,
      cnh: driver.cnh,
      email: driver.email,
    })

    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (data: UpdateDriverData) => {
    if (!editingDriver) return

    updateDriverMutation.mutate({
      id: editingDriver.id,
      payload: data,
    })
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Motoristas</h1>

          <Button onClick={() => setIsAddModalOpen(true)}>
            Adicionar Motorista
          </Button>
        </div>

        {/* MODAL ADICIONAR */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">
                Novo Motorista
              </h2>

              <form onSubmit={createForm.handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <Label htmlFor="full_name">Nome</Label>

                  <Input
                    id="full_name"
                    placeholder="Digite o nome"
                    {...createForm.register("full_name")}
                  />
                  {createForm.formState.errors.full_name && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <Label htmlFor="cnh">CNH</Label>

                  <Input
                    id="cnh"
                    placeholder="Digite o número da CNH"
                    {...createForm.register("cnh")}
                  />
                  {createForm.formState.errors.cnh && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.cnh.message}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <Label htmlFor="email">Email</Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o email"
                    {...createForm.register("email")}
                  />
                  {createForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <Label htmlFor="password">Senha</Label>
                
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a senha"
                    {...createForm.register("password")}
                  />
                  {createForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false)
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={createDriverMutation.isPending}
                  >
                    {createDriverMutation.isPending
                      ? 'Registrando...'
                      : 'Registrar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR */}
        {isEditModalOpen && editingDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">
                Editar Motorista
              </h2>

              <form onSubmit={editForm.handleSubmit(handleSaveEdit)}>
                <div className="mb-4">
                  <Label htmlFor="edit-name">Nome</Label>

                  <Input
                    id="edit-name"
                    placeholder="Digite o nome"
                    {...editForm.register("full_name")}
                  />
                  {editForm.formState.errors.full_name && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <Label htmlFor="edit-cnh">CNH</Label>

                  <Input
                    id="edit-cnh"
                    placeholder="Digite o número da CNH"
                    {...editForm.register("cnh")}
                  />
                  {editForm.formState.errors.cnh && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.cnh.message}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <Label htmlFor="edit-email">Email</Label>

                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Digite o email"
                    {...editForm.register("email")}
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {editForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingDriver(null)
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={updateDriverMutation.isPending}
                  >
                    {updateDriverMutation.isPending
                      ? 'Salvando...'
                      : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TABELA */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center">
              Carregando motoristas...
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-red-500">
              Erro ao carregar motoristas
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    ID
                  </th>

                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Nome
                  </th>

                  <th className="border border-gray-300 px-4 py-2 text-left">
                    CNH
                  </th>

                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Email
                  </th>

                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {driver.id}
                    </td>

                    <td className="border border-gray-300 px-4 py-2">
                      {driver.full_name}
                    </td>

                    <td className="border border-gray-300 px-4 py-2">
                      {driver.cnh}
                    </td>

                    <td className="border border-gray-300 px-4 py-2">
                      {driver.email}
                    </td>

                    <td className="space-x-2 border border-gray-300 px-4 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDriver(driver)}
                      >
                        Editar
                      </Button>

                      <ConfirmDeleteDialog
                        onConfirm={() => deleteDriverMutation.mutate(driver.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}