import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import type { Bus } from './BusesPage'
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'

interface BusesTableProps {
  buses: Bus[]
  onDeleteBus: (id: number) => void
}

export const BusesTable = ({ buses, onDeleteBus }: BusesTableProps) => {
  return (
    <Card className="w-full lg:flex-1 min-w-0">
      <CardHeader>
        <CardTitle>Frota Cadastrada</CardTitle>
        <CardDescription>
          Visualização e status dos veículos registrados no sistema.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                <th className="p-4">Placa</th>
                <th className="p-4">Modelo / Marca</th>
                <th className="p-4 text-center">Capacidade</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">
                    {bus.number_plate}
                  </td>
                  <td className="p-4 text-foreground">
                    {bus.brand}
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    {bus.seating_capacity} assentos
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      bus.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {bus.status === 'active' ? 'Ativo' : 'Manutenção'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                      <ConfirmDeleteDialog
                        onConfirm={() => onDeleteBus(bus.id)}
                      />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}