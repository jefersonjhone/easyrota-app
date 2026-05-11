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

export type Link = {
  title: string
  description: string
  background: ImageLink
  goesTo: AnyRoute
}

export const links: Link[] = [
  { 
    title: "Frota Ativa",
    description: "Veja a ocupação em tempo real.",
    background: BusInRouteImage,
    goesTo: TravelRoute,
  },
  {
    title: "Gestão de Veículos",
    description: "Gerencie seus veículos.",
    background: BusFleetImage,
    goesTo: RoutesRoute,
  },
  {
    title: "Equipe de Motoristas",
    description: "Gerencie sua equipe.",
    background: BusDriverImage,
    goesTo: DriversRoute,
  },
  {
    title: "Malha de Rotas",
    description: "Crie novos trajetos, defina novas paradas.",
    background: MapImage,
    goesTo: RoutesRoute,
  },
  {
    title: "Administradores",
    description: "Conceda privilégios de gestão a novos usuários.",
    background: AdminImage,
    goesTo: AdminsRoute,
  },
  {
    title: "Relatórios Gerais",
    description: "Estatísticas de uso e eficiência da frota.",
    background: AnalyticsImage,
    goesTo: ReportRoute,
  },
]
