import { MapTrifold, ArrowUpRight } from "@phosphor-icons/react"
import { Card, CardContent } from '@ui/card'
import { NativeSelect, NativeSelectOption } from '@lib/ui/native-select'

export function TotalTripsCard({ total, onFilterChange }: { total: number; onFilterChange: (days: number) => void }) {
  return (
    <Card className="rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
            <MapTrifold size={20} weight="duotone" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Viagens</span>
        </div>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="0">Hoje</NativeSelectOption>
          <NativeSelectOption value="7">7 dias</NativeSelectOption>
          <NativeSelectOption value="15">15 dias</NativeSelectOption>
        </NativeSelect>
      </div>
      <CardContent className="p-0 mt-4">
        <div className="text-3xl font-bold tracking-tight">{total}</div>
        <p className="mt-1 text-xs text-muted-foreground">Viagens programadas</p>
      </CardContent>
    </Card>
  )
}

export function TripsInProgress({ total }: { total: number }) {
  return (
    <Card className="rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
          <ArrowUpRight size={20} weight="duotone" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Em andamento</span>
      </div>
      <CardContent className="p-0 mt-4">
        <div className="text-3xl font-bold tracking-tight">{total}</div>
        <p className="mt-1 text-xs text-muted-foreground">Viagens em andamento agora</p>
      </CardContent>
    </Card>
  )
}
