// Assets
import { 
  AdminImage, 
  AnalyticsImage, 
  BusDriverImage, 
  BusFleetImage, 
  BusInRouteImage, 
  MapImage, type ImageLink 
} from '@/features/admin/config/ImageLink'

import { 
  AdminsRoute,
  DriversRoute,
  ReportRoute,
  RoutesRoute,
  TravelRoute
} from '@/features/admin/config/RoutesLink'
import type { AnyRoute } from '@tanstack/react-router'

export type Action = {
  title: string
  description: string
  background: ImageLink
  route: AnyRoute
}

export const actions: Action[] = [
  { 
    title: "Frota Ativa",
    description: "Veja a ocupação em tempo real.",
    background: BusInRouteImage,
    route: TravelRoute,
  },
  {
    title: "Gestão de Veículos",
    description: "Gerencie seus veículos.",
    background: BusFleetImage,
    route: RoutesRoute,
  },
  {
    title: "Equipe de Motoristas",
    description: "Gerencie sua equipe.",
    background: BusDriverImage,
    route: DriversRoute,
  },
  {
    title: "Malha de Rotas",
    description: "Crie novos trajetos, defina novas paradas.",
    background: MapImage,
    route: RoutesRoute,
  },
  {
    title: "Administradores",
    description: "Conceda privilégios de gestão a novos usuários.",
    background: AdminImage,
    route: AdminsRoute,
  },
  {
    title: "Relatórios Gerais",
    description: "Estatísticas de uso e eficiência da frota.",
    background: AnalyticsImage,
    route: ReportRoute,
  },
]
