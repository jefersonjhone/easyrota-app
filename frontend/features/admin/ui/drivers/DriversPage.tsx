import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import { Label } from "@/lib/ui/label"

import { apiFetch } from '@/lib/api'
import { AdminLayout } from '@/features/admin/ui/Layout'

interface Driver {
  id: string
  full_name: string
  cnh: string
  email: string
}

interface DriverPayload {
  full_name: string
  cnh: string
  email: string
  password: string
}

export function ManageDriversPage() {
  const queryClient = useQueryClient()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

  const [formData, setFormData] = useState<DriverPayload>({
    full_name: '',
    cnh: '',
    email: '',
    password: '',
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
    mutationFn: async (payload: DriverPayload) => {
      return apiFetch('/drivers/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['drivers'],
      })

      resetForm()
      setIsAddModalOpen(false)
    },
  })

  // EDITAR MOTORISTA
  const updateDriverMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: DriverPayload
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

      resetForm()
      setEditingDriver(null)
      setIsEditModalOpen(false)
    },
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

  const resetForm = () => {
    setFormData({
      full_name: '',
      cnh: '',
      email: '',
      password: '',
    })
  }

  const validateForm = () => {
    if (!formData.full_name || !formData.cnh || !formData.email || !formData.password) {
      alert('Por favor preencha todos os campos')
      return false
    }

    return true
  }

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    createDriverMutation.mutate(formData)
  }

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver)

    setFormData({
      full_name: driver.full_name,
      cnh: driver.cnh,
      email: driver.email,
      password: "",
    })

    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!editingDriver) return

    updateDriverMutation.mutate({
      id: editingDriver.id,
      payload: formData,
    })
  }

  const handleDeleteDriver = (id: string) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja deletar este motorista?'
    )

    if (!confirmed) return

    deleteDriverMutation.mutate(id)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

              <form onSubmit={handleAddDriver}>
                <div className="mb-4">
                  <Label htmlFor="full_name">Nome</Label>

                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Digite o nome"
                  />
                </div>

                <div className="mb-4">
                  <Label htmlFor="cnh">CNH</Label>

                  <Input
                    id="cnh"
                    name="cnh"
                    value={formData.cnh}
                    onChange={handleChange}
                    placeholder="Digite o número da CNH"
                  />
                </div>

                <div className="mb-6">
                  <Label htmlFor="email">Email</Label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Digite o email"
                  />
                </div>
                <div className="mb-6">
                  <Label htmlFor="password">Senha</Label>
                
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Digite a senha"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      resetForm()
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

              <form onSubmit={handleSaveEdit}>
                <div className="mb-4">
                  <Label htmlFor="edit-name">Nome</Label>

                  <Input
                    id="edit-name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Digite o nome"
                  />
                </div>

                <div className="mb-4">
                  <Label htmlFor="edit-cnh">CNH</Label>

                  <Input
                    id="edit-cnh"
                    name="cnh"
                    value={formData.cnh}
                    onChange={handleChange}
                    placeholder="Digite o número da CNH"
                  />
                </div>

                <div className="mb-6">
                  <Label htmlFor="edit-email">Email</Label>

                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Digite o email"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingDriver(null)
                      resetForm()
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

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDriver(driver.id)}
                        disabled={deleteDriverMutation.isPending}
                      >
                        Deletar
                      </Button>
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