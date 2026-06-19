import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import type { Bus } from './BusesPage'
import { ConfirmDeleteDialog } from '@/lib/ui/delete-alert'

interface BusesTableProps {
  buses: Bus[]
  onDeleteBus: (id: string) => void
  onEditBus: (bus: Bus) => void
}

export const BusesTable = ({ buses, onDeleteBus, onEditBus }: BusesTableProps) => {
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
          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
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
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum ônibus cadastrado no momento.
                  </td>
                </tr>
              ) : (
                buses.map((bus) => (
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
                        bus.status === 'ATIVO' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {bus.status === 'ATIVO' ? 'Ativo' : 'Manutenção'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditBus(bus)}
                          className="inline-flex items-center justify-center p-2 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer h-9 w-9 box-border"
                          title="Editar veículo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>

                        <ConfirmDeleteDialog
                          onConfirm={() => onDeleteBus(bus.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}