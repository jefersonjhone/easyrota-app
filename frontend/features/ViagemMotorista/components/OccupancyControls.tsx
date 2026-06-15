import { Button } from '@ui/button'
import { UserMinusIcon, UserPlusIcon, BusIcon } from '@phosphor-icons/react'

type Props = {
  embarkedCount: number
  activeCapacity: number
  occupancyPercent: number
  onAddPassenger: () => void
  onOpenRemovePassenger: () => void
  onRequestBus: () => void
  boardedPassengersLength: number
  isPassengerRemoving: boolean
}

export function OccupancyControls({
  embarkedCount,
  activeCapacity,
  occupancyPercent,
  onAddPassenger,
  onOpenRemovePassenger,
  onRequestBus,
  boardedPassengersLength,
  isPassengerRemoving,
}: Props) {
  return (
    <>
      <div className="mt-8 grid w-full max-w-md gap-2">
        <div className="h-4 overflow-hidden rounded-full border border-primary-foreground bg-slate-100">
          <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${occupancyPercent}%` }} />
        </div>
        <p className="text-sm  text-foreground font-medium uppercase tracking-wide">{embarkedCount}/{activeCapacity} check-ins confirmados</p>
      </div>

      <div className="mt-6 grid w-full max-w-md gap-3">
        <Button type="button" className="min-h-12 rounded-lg font-bold border" onClick={onAddPassenger}>
          <UserPlusIcon aria-hidden="true" weight="bold" />
          Adicionar passageiro
        </Button>

        <Button
          type="button"
          variant="outline"
          className="min-h-12 rounded-lg font-bold"
          onClick={onOpenRemovePassenger}
          disabled={boardedPassengersLength === 0 || isPassengerRemoving}
        >
          <UserMinusIcon aria-hidden="true" weight="bold" />
          Remover passageiro
        </Button>

        <Button type="button" variant="outline" className="min-h-12 rounded-lg font-bold" onClick={onRequestBus}>
          <BusIcon aria-hidden="true" weight="bold" />
          Solicitar novo onibus
        </Button>
      </div>
    </>
  )
}
