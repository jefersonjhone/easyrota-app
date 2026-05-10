// Caminhos baseados na sua estrutura de pastas da imagem dd417d.png
import { Button } from '../../../lib/ui/button'
import { Input } from '../../../lib/ui/input'
import { Card } from '../../../lib/ui/card'
import { AdminLayout } from './admin-layout'

export function BusPage() {
  return (
    <AdminLayout 
      title="Gestão de Frota" 
      description="Gerenciamento de veículos e capacidade operacional."
    >
      <Card className="p-4 md:p-6 border-none shadow-sm bg-white">
        <h3 className="font-heading font-bold mb-6 text-lg text-black">Cadastrar Novo Veículo</h3>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase text-muted-foreground">Placa</label>
            <Input placeholder="Ex: ABC-1234" />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase text-muted-foreground">Modelo</label>
            <Input placeholder="Ex: Marcopolo Torino" />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase text-muted-foreground">Capacidade</label>
            <Input type="number" placeholder="Assentos" />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button className="bg-[#bd4b00] hover:bg-[#a34100] w-full md:w-fit px-12 text-white font-bold h-12 uppercase">
              Salvar Veículo
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  )
}