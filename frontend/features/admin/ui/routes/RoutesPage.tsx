import { useShowRoutes } from "@/features/admin/hooks/useRoutes";
import { AdminLayout } from '@/features/admin/ui/Layout'
import { RoutesView } from "./RoutesView";
import { RouteForm } from "./RoutesForm";
import { Button } from "@/lib/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'
import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, PlusIcon, MapPin } from "@phosphor-icons/react";

export default function RoutesPage() {
  const { data, refetch } = useShowRoutes();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredRoutes = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase().trim()
    if (!q) return data
    return data.filter((r) =>
      r.origin.toLowerCase().includes(q) || r.destiny.toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <AdminLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Viagens e Rotas
            </p>
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-primary shrink-0" />
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Rotas
              </h1>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 mt-1.5 cursor-pointer">
                <PlusIcon className="mr-2" weight="bold" size={20} />
                Criar rota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova rota</DialogTitle>
              </DialogHeader>
              <RouteForm onCreate={() => { refetch(); setIsCreateOpen(false) }} />
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Busca</label>
            <div className="relative">
              <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Origem ou destino..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full md:w-40 rounded-md border border-border bg-card pl-8 pr-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap mb-0.5">
            {filteredRoutes.length} rotas
          </span>
        </div>

        <RoutesView routes={filteredRoutes} onRefresh={() => { refetch() }} />
      </section>
    </AdminLayout>
  );
}
