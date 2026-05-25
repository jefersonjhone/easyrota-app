import { CardContent } from "@/lib/ui/card"
import { ArrowUpRight } from "lucide-react"

import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle } from '@ui/card'
import { BusIcon} from "@phosphor-icons/react"


export function TotalBusesCard({ total }: { total: number }) {
  return (
      <Card className="cursor-pointer hover:shadow-md transition group rounded-sm p-2 md:p-4 md:max-h-72">
        <Link to="/admin">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 ">
          <BusIcon className="h-10 md:h-12 w-10 md:w-12 bg-chart-2 text-gray-200 p-2 rounded-full" />
          <CardTitle className="text-sm font-semibold text-center">
            Onibus cadastrados
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
        </CardHeader>
        </Link>

        <CardContent className="text-center ">
                  <div className="flex items-center justify-center">
                    <div className="text-4xl font-bold ">{total}</div>
                  </div>
        
                  <p className="text-xs text-muted-foreground mt-1">
                    Onibus cadastrados no sistema
                  </p>
                </CardContent>
      </Card>
  )
}