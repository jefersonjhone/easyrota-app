// Assets
import adminImage from "@assets/admin/admin.jpg"
import analyticsImage from "@assets/admin/analytics.jpg"
import busFleetImage from "@assets/admin/bus-fleet.jpg"
import busInRouteImage from "@assets/admin/bus-in-route.jpg"
import busDriverImage from "@assets/admin/bus-driver.jpg"
import mapImage from "@assets/admin/map.jpg"

type ImageLink = string

const images: Record<string, ImageLink> = {
  inRoute: busInRouteImage,
  fleet: busFleetImage,
  driver: busDriverImage,
  map: mapImage,
  admins: adminImage,
  analytics: analyticsImage,
}

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
    background: images.inRoute,
    goesTo: 'viagens',
  },
  {
    title: "Gestão de Veículos",
    description: "Gerencie seus veículos.",
    background: images.fleet,
    goesTo: 'veiculos',
  },
  {
    title: "Equipe de Motoristas",
    description: "Gerencie sua equipe.",
    background: images.driver,
    goesTo: 'motoristas',
  },
  {
    title: "Malha de Rotas",
    description: "Crie novos trajetos, defina novas paradas.",
    background: images.map,
    goesTo: 'rotas',
  },
  {
    title: "Administradores",
    description: "Conceda privilégios de gestão a novos usuários.",
    background: images.admins,
    goesTo: 'administradores',
  },
  {
    title: "Relatórios Gerais",
    description: "Estatísticas de uso e eficiência da frota.",
    background: images.analytics,
    goesTo: 'relatorios',
  },
]