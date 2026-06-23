import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from "@/lib/ui/button"
import { Label } from "@/lib/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/ui/dialog"
import { MagnifyingGlassIcon, UserPlus } from "@phosphor-icons/react"

import { apiFetch } from '@lib/api'
import { useCreateReservation } from '@/features/admin/hooks/useReservations'
import { tripAdminKeys } from '@/features/admin/hooks/useTripAdminDetail'

interface SearchResult {
  id: number
  full_name: string
  student_id?: string
  civil_servant_id?: string
}

type PassengerType = 'ESTUDANTE' | 'SERVIDOR' | 'CONVIDADO'

const TYPE_OPTIONS: { value: PassengerType; label: string }[] = [
  { value: 'ESTUDANTE', label: 'Estudante' },
  { value: 'SERVIDOR', label: 'Servidor' },
  { value: 'CONVIDADO', label: 'Convidado' },
]

interface Props {
  tripId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPassengerModal({ tripId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const createMutation = useCreateReservation()

  const [type, setType] = useState<PassengerType>('ESTUDANTE')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestCpf, setGuestCpf] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setSearch('')
    setResults([])
    setSelected(null)
    setGuestName('')
    setGuestCpf('')
  }, [type])

  useEffect(() => {
    if (type === 'CONVIDADO' || search.trim().length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const endpoint = type === 'ESTUDANTE' ? '/students/' : '/civil-servants/'
        const data = await apiFetch<SearchResult[]>(`${endpoint}?q=${encodeURIComponent(search.trim())}`)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, type])

  const handleSubmit = async () => {
    const payload: any = { trip: tripId, passenger_type: type }

    if (type === 'CONVIDADO') {
      if (!guestName.trim() || !guestCpf.trim()) return
      payload.guest_name = guestName.trim()
      payload.guest_cpf = guestCpf.replace(/\D/g, '')
    } else {
      if (!selected) return
      payload.profile_id = selected.id
    }

    await createMutation.mutateAsync(payload)
    queryClient.invalidateQueries({ queryKey: tripAdminKeys.detail(tripId) })
    onOpenChange(false)
  }

  const isValid =
    type === 'CONVIDADO'
      ? guestName.trim().length > 0 && guestCpf.replace(/\D/g, '').length >= 11
      : selected !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={18} />
            Adicionar passageiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  type === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-ring hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {type !== 'CONVIDADO' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Buscar {type === 'ESTUDANTE' ? 'estudante' : 'servidor'}
                </Label>
                <div className="relative">
                  <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder={type === 'ESTUDANTE' ? 'Nome ou matrícula...' : 'Nome ou matrícula...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              {searching && (
                <p className="text-xs text-muted-foreground">Buscando...</p>
              )}

              {results.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border/50">
                  {results.map((r) => {
                    const isSelected = selected?.id === r.id
                    const idDisplay = r.student_id ?? r.civil_servant_id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelected(r)
                          setSearch(r.full_name)
                          setResults([])
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/5 font-medium' : ''
                        }`}
                      >
                        <span className="block font-medium">{r.full_name}</span>
                        <span className="block text-muted-foreground">{idDisplay}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {selected && (
                <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Selecionado: </span>
                  <span className="font-medium">{selected.full_name}</span>
                  <span className="text-muted-foreground"> ({selected.student_id ?? selected.civil_servant_id})</span>
                </div>
              )}

              {!searching && search.trim().length >= 2 && results.length === 0 && (
                <p className="text-xs text-destructive">Nenhum resultado encontrado.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Nome completo
                </Label>
                <input
                  type="text"
                  placeholder="Nome do convidado..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  CPF
                </Label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={guestCpf}
                  onChange={(e) => setGuestCpf(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={!isValid || createMutation.isPending} onClick={handleSubmit}>
              {createMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
