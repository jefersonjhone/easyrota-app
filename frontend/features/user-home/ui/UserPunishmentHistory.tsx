import { useState } from 'react'
import AppLayout from '@/lib/layout/app-layout'
import { Warning } from "@phosphor-icons/react"
import { usePunishmentsHistory } from "@/features/user-home/hooks/usePunishmentHistory"
import { Button } from '@ui/button'

import { formatReservationCreatedAt } from '../config'

interface Punishment {
  id: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

type FilterType = 'ALL' | 'ACTIVE' | 'FULFILLED'

export function PunishmentsHistoryPage() {
  const { data: punishments, isPending, isError } = usePunishmentsHistory()
  const [filter, setFilter] = useState<FilterType>('ALL')

  const filteredPunishments = punishments?.filter((p: Punishment) => {
    if (filter === 'ACTIVE') return p.is_active
    if (filter === 'FULFILLED') return !p.is_active
    return true
  }).sort((a, b) => {
    if (a.is_active && !b.is_active) return -1
    if (!a.is_active && b.is_active) return 1
    
    const dataA = new Date(a.created_at).getTime()
    const dataB = new Date(b.created_at).getTime()
    return dataB - dataA
  }) || []

  return (
    <AppLayout>
      <section className="mt-8 mx-auto w-full max-w-4xl px-4">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Seu Histórico
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Penalidades
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o registro completo de penalidades aplicadas ao seu perfil.
          </p>
        </header>

        {punishments && punishments.length > 0 && (
          <div className="mb-6 flex gap-2">
            <Button 
              variant={filter === 'ALL' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('ALL')}
            >
              Todas
            </Button>
            <Button 
              variant={filter === 'ACTIVE' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('ACTIVE')}
            >
              Ativas
            </Button>
            <Button 
              variant={filter === 'FULFILLED' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('FULFILLED')}
            >
              Cumpridas
            </Button>
          </div>
        )}

        {isPending ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            Carregando histórico completo...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
            Ocorreu um erro ao carregar o seu histórico. Tente novamente mais tarde.
          </div>
        ) : !punishments || punishments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            Você não possui nenhuma penalidade registrada. Continue assim!
          </div>
        ) : filteredPunishments?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
            Nenhuma penalidade encontrada para este filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPunishments.map((punishment: Punishment) => (
              <article
                key={punishment.id}
                className="flex justify-between items-center p-4 border rounded-lg transition-shadow bg-card hover:shadow-sm"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Warning 
                    className={`w-12 h-12 p-2.5 rounded-lg ${
                      punishment.is_active 
                        ? "text-red-600 bg-red-100" 
                        : "text-gray-500 bg-gray-100"
                    }`} 
                  />
                  <div className="flex-1">
                    <p className="font-medium text-base text-foreground">
                      {punishment.description}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registrado em: {formatReservationCreatedAt(punishment.created_at)}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                      punishment.is_active 
                        ? "bg-red-600 text-white" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {punishment.is_active ? "Ativa" : "Cumprida"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  )
}