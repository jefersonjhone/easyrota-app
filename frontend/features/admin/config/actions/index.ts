// Assets
import { 
  AdminImage, 
  AnalyticsImage, 
  BusDriverImage, 
  BusFleetImage, 
  BusInRouteImage, 
  MapImage, type ImageLink 
} from '@/features/admin/config/actions/images'

import { 
  AdminsRoute,
  BusesRoute,
  DriversRoute,
  ReportRoute,
  RoutesRoute,
  TravelRoute
} from '@/features/admin/config/actions/routes'

import {
  BusInRouteIcon,
  BusFleetIcon,
  BusDriverIcon,
  MapIcon,
  AdminIcon,
  ReportIcon,
} from '@/features/admin/config/actions/icons'

import type { AnyRoute } from '@tanstack/react-router'
import type { Icon } from '@phosphor-icons/react'

export type Action = {
  title: string
  description: string
  icon: Icon
  background: ImageLink
  route: AnyRoute
}

export const actions: Action[] = [
  { 
    title: "Gestão de Viagens",
    description: "Gerencie as viagens.",
    icon: BusInRouteIcon,
    background: BusInRouteImage,
    route: TravelRoute,
  },
  {
    title: "Gestão de Veículos",
    description: "Gerencie seus veículos.",
    icon: BusFleetIcon,
    background: BusFleetImage,
    route: BusesRoute,
  },
  {
    title: "Equipe de Motoristas",
    description: "Gerencie sua equipe.",
    icon: BusDriverIcon,
    background: BusDriverImage,
    route: DriversRoute,
  },
  {
    title: "Malha de Rotas",
    description: "Crie novos trajetos, defina novas paradas.",
    icon: MapIcon,
    background: MapImage,
    route: RoutesRoute,
  },
  {
    title: "Administradores",
    description: "Conceda privilégios de gestão a novos usuários.",
    icon: AdminIcon,
    background: AdminImage,
    route: AdminsRoute,
  },
  {
    title: "Relatórios Gerais",
    description: "Estatísticas de uso e eficiência da frota.",
    icon: ReportIcon,
    background: AnalyticsImage,
    route: ReportRoute,
  },
]
