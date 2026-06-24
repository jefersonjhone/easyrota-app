import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@ui/dialog'
import { UserMinusIcon } from '@phosphor-icons/react'
import { cn } from '@utils'
import type { PassengerBoardItem } from '../types'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  passengerRemoveQuery: string
  onPassengerRemoveQueryChange: (value: string) => void
  boardedPassengersLength: number
  removablePassengers: PassengerBoardItem[]
  selectedPassengerToRemove: PassengerBoardItem | null
  onSelectPassengerToRemove: (p: PassengerBoardItem) => void
  isPassengerRemoving: boolean
  actionError: string | null
  onCancel: () => void
  onSubmit: () => void
  canSubmitRemovePassenger: boolean
}

export function PassengerRemoveDialog({
  isOpen,
  onOpenChange,
  passengerRemoveQuery,
  onPassengerRemoveQueryChange,
  boardedPassengersLength,
  removablePassengers,
  selectedPassengerToRemove,
  onSelectPassengerToRemove,
  isPassengerRemoving,
  actionError,
  onCancel,
  onSubmit,
  canSubmitRemovePassenger,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <DialogHeader className="items-center text-center">
            <UserMinusIcon aria-hidden="true" weight="fill" className="size-8 text-primary" />
            <DialogTitle>Remover passageiro</DialogTitle>
            <DialogDescription>Pesquise pelo nome na lista de passageiros embarcados.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="driver-passenger-remove-search">Pesquisar nome</Label>
            <Input id="driver-passenger-remove-search" type="text" value={passengerRemoveQuery} onChange={(event) => onPassengerRemoveQueryChange(event.target.value)} placeholder="Digite o nome" autoFocus />
          </div>

          {boardedPassengersLength === 0 ? (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-muted-foreground">Nenhum passageiro embarcado.</p>
          ) : removablePassengers.length > 0 ? (
            <div role="listbox" aria-label="Passageiros embarcados" className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background p-1">
              {removablePassengers.map((passenger) => {
                const isSelected = selectedPassengerToRemove?.reservationId === passenger.reservationId
                  && selectedPassengerToRemove?.localPassengerId === passenger.localPassengerId
                  && selectedPassengerToRemove?.name === passenger.name
                const hasIdentifier = Boolean(passenger.reservationId ?? passenger.localPassengerId)
                const passengerMeta = passenger.kind ? `${passenger.source} - ${passenger.kind}` : passenger.source

                return (
                  <button
                    key={`${passenger.source}-${passenger.reservationId ?? passenger.localPassengerId ?? passenger.id}-${passenger.name}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={!hasIdentifier || isPassengerRemoving}
                    className={cn(
                      'flex w-full min-w-0 flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                    )}
                    onClick={() => onSelectPassengerToRemove(passenger)}
                  >
                    <span className="w-full truncate text-sm font-bold">{passenger.name}</span>
                    <span className={cn('text-xs font-semibold', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {hasIdentifier ? passengerMeta : 'Identificador indisponivel'}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-muted-foreground">Nenhum passageiro encontrado.</p>
          )}

          {selectedPassengerToRemove ? (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">{selectedPassengerToRemove.name} selecionado para remocao.</p>
          ) : null}

          {actionError ? (<p role="alert" className="text-sm font-bold text-red-700">{actionError}</p>) : null}

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={onCancel} disabled={isPassengerRemoving}>Cancelar</Button>
            <Button type="submit" className="rounded-lg" disabled={!canSubmitRemovePassenger}>{isPassengerRemoving ? 'Removendo...' : 'Remover'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
