import { BusIcon } from '@phosphor-icons/react'
import { NativeSelect, NativeSelectOption } from '@ui/native-select'
import type { DriverBusOption } from '../types'

type Props = {
  origin: string
  destiny: string
  departureTime: string
  selectedBusId: number | null
  isBusActionLoading: boolean
  busOptions: DriverBusOption[]
  onBusSelection: (busId: number | null) => void
}

export function TripInfo({
  origin,
  destiny,
  departureTime,
  selectedBusId,
  isBusActionLoading,
  busOptions,
  onBusSelection,
}: Props) {
  return (
    <div className="grid gap-3">
      <p className="text-xs font-bold uppercase text-primary">Viagem atual</p>
      <h1 id="driver-trip-screen-title" className="font-heading text-3xl font-semibold leading-tight text-foreground md:text-5xl">
        {origin} <span className="font-sans text-xl font-semibold text-muted-foreground md:text-2xl">para</span> {destiny}
      </h1>
      <div className="flex flex-wrap justify-center gap-2">
        <span className="flex items-center rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold text-muted-foreground">
          {departureTime}
        </span>
        <label className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 text-sm font-semibold text-muted-foreground">
          <BusIcon aria-hidden="true" weight="fill" className="size-4 text-foreground" />
          <NativeSelect
            aria-label="Selecionar onibus da viagem"
            value={selectedBusId ?? ''}
            disabled={isBusActionLoading}
            onChange={(event) => onBusSelection(event.target.value ? Number(event.target.value) : null)}
            className="w-40"
            size="sm"
          >
            <NativeSelectOption value="">Sem onibus</NativeSelectOption>
            {busOptions.map((bus) => (
              <NativeSelectOption key={bus.id} value={bus.id}>
                {bus.plate}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
    </div>
  )
}
