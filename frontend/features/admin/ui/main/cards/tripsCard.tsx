import { CardContent } from "@/lib/ui/card"
import { ArrowUpRightIcon} from "@phosphor-icons/react"

import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle } from '@ui/card'
import { MapTrifoldIcon } from "@phosphor-icons/react"
import {
            NativeSelect,
            NativeSelectOption,
          } from '@lib/ui/native-select'

export function TotalTripsCard({ total, onFilterChange }: { total: number; onFilterChange: (days: number) => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition group rounded-lg p-2 md:p-4">
      <Link to="/admin">
        <CardHeader className="flex flex-col lg:flex-row md:items-center justify-between space-y-0 p-1">
            <div className="flex gap-4 text-base p-0 m-0 justify-between items-center">
          <MapTrifoldIcon className="h-10 md:h-12 w-10 md:w-12 bg-chart-2 text-white p-2 rounded-full" />
          <CardTitle className="text-sm font-semibold p-0 m-0">
            Viagens para
          </CardTitle>
            </div>
          <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))}>
                    <NativeSelectOption value="0">Hoje</NativeSelectOption>
                    <NativeSelectOption value="7">Próximos 7 dias</NativeSelectOption>
                    <NativeSelectOption value="15">Próximos 15 dias</NativeSelectOption>
            </NativeSelect>
            <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
        </CardHeader>
      </Link>

        <CardContent className="text-center ">
                  <div className="flex items-center justify-center">
                    <div className="text-4xl font-bold ">{total}</div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Viagens cadastradas
                  </p>
                </CardContent>
      </Card>
  )
}

export function TripsInProgress({ total }: { total: number }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition group rounded-lg p-2 md:p-4">
      <Link to="/admin/viagens">
            <CardHeader className="flex items-center justify-between space-y-0 p-0">
                  <MapTrifoldIcon className="h-10 md:h-12 w-10 md:w-12 bg-chart-2 text-white p-2 rounded-full" />
                  <CardTitle className="text-sm font-semibold text-center w-full ">
                    Viagens em andamento
                  </CardTitle>
                  <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
        </CardHeader>
    </Link>

        <CardContent className="text-center ">
                  <div className="flex items-center justify-center">
                    <div className="text-4xl font-bold ">{total}</div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Viagens em andamento
                  </p>
                </CardContent>
      </Card>
  )
}
