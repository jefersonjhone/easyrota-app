import { SteeringWheel } from "@phosphor-icons/react"
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@ui/card'

export function TotalDriversCard({ total }: { total: number }) {
  return (
    <Link to="/admin/motoristas" className="block">
      <Card className="group cursor-pointer rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
              <SteeringWheel size={20} weight="duotone" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Motoristas</span>
          </div>
        </div>
        <CardContent className="p-0 mt-4">
          <div className="text-3xl font-bold tracking-tight">{total}</div>
          <p className="mt-1 text-xs text-muted-foreground">Motoristas cadastrados no sistema</p>
        </CardContent>
      </Card>
    </Link>
  )
}
