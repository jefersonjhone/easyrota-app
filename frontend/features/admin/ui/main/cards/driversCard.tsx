import { CardContent } from "@/lib/ui/card"
import { SteeringWheelIcon, ArrowUpRightIcon} from "@phosphor-icons/react"

import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle } from '@ui/card'

export function TotalDriversCard({ total }: { total: number }) {
  return (
      <Card className="cursor-pointer hover:shadow-md transition group rounded-lg p-2 md:p-4">
        <Link to="/admin/motoristas">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
          <SteeringWheelIcon className="h-10 w-10 md:h-12 md:w-12 bg-chart-2 text-white p-2 rounded-full" />
          <CardTitle className="text-sm font-semibold text-center">
            Motoristas cadastrados
          </CardTitle>
          <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
        </CardHeader>
        </Link>

        <CardContent className="text-center mt-0">
                  <div className="flex items-center justify-center">
                    <div className="text-4xl font-bold">{total}</div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Motoristas cadastrados no sistema
                  </p>
                </CardContent>
      </Card>
  )
}
