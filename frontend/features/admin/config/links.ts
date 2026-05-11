// Assets
import { 
  AdminImage, 
  AnalyticsImage, 
  BusDriverImage, 
  BusFleetImage, 
  BusInRouteImage, 
  MapImage, type ImageLink 
} from '@/features/admin/config/ImageLink'

export type Link = {
  title: string
  description: string
  background: ImageLink
  goesTo: string
}

export const links: Link[] = [
  { 
    title: "Frota Ativa",
    description: "Veja a ocupação em tempo real.",
    background: BusInRouteImage,
    goesTo: '/viagens',
  },
  {
    title: "Gestão de Veículos",
    description: "Gerencie seus veículos.",
    background: BusFleetImage,
    goesTo: '/adminbus',
  },
  {
    title: "Equipe de Motoristas",
    description: "Gerencie sua equipe.",
    background: BusDriverImage,
    goesTo: 'motoristas',
  },
  {
    title: "Malha de Rotas",
    description: "Crie novos trajetos, defina novas paradas.",
    background: MapImage,
    goesTo: 'rotas',
  },
  {
    title: "Administradores",
    description: "Conceda privilégios de gestão a novos usuários.",
    background: AdminImage,
    goesTo: 'administradores',
  },
  {
    title: "Relatórios Gerais",
    description: "Estatísticas de uso e eficiência da frota.",
    background: AnalyticsImage,
    goesTo: 'relatorios',
  },
]
