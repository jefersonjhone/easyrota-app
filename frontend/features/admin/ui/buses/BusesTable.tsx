import type { Bus } from './BusesPage'
import { Link } from '@tanstack/react-router'
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react"
import { Button } from "@ui/button"

interface BusesTableProps {
  buses: Bus[]
  onDeleteBus: (id: string) => void
  onEditBus: (bus: Bus) => void
}

export const BusesTable = ({ buses, onDeleteBus, onEditBus }: BusesTableProps) => {
  if (buses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
        Nenhum ônibus cadastrado no momento.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card/90 overflow-hidden">
      <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_130px_70px] md:px-5 md:py-2 md:bg-muted/40 md:text-[11px] md:font-semibold md:tracking-wider md:text-muted-foreground md:uppercase md:border-b md:border-border/50">
        <span>Placa</span>
        <span>Modelo / Marca</span>
        <span className="text-center">Capacidade</span>
        <span className="text-center">Status</span>
        <span className="text-right">Ações</span>
      </div>
      <div className="divide-y divide-border/50">
        {buses.map((bus) => (
          <div
            key={bus.id}
            className="flex flex-col gap-1 px-5 py-3 text-sm transition-colors hover:bg-muted/30 md:grid md:grid-cols-[1fr_1fr_100px_130px_70px] md:items-center"
          >
            <Link to="/admin/onibus/$id" params={{ id: String(bus.id) }} className="font-mono font-bold underline hover:text-primary/80 transition-colors">
              {bus.number_plate}
            </Link>
            <span className="text-muted-foreground text-xs md:text-sm md:text-foreground">{bus.brand}</span>
            <span className="text-center text-muted-foreground text-xs md:text-sm">{bus.seating_capacity} assentos</span>
            <span className={`inline-flex items-center justify-center mx-auto rounded-full px-2.5 py-0.5 text-xs font-medium border w-fit ${
              bus.status === 'ATIVO'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {bus.status === 'ATIVO' ? 'Ativo' : 'Manutenção'}
            </span>
            <div className="flex items-center gap-1 justify-end">
              <button
                type="button"
                onClick={() => onEditBus(bus)}
                className="inline-flex items-center justify-center p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Editar veículo"
              >
                <PencilSimpleIcon size={14} />
              </button>
              <ConfirmDeleteDialog
                onConfirm={() => onDeleteBus(bus.id)}
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
  )
}
