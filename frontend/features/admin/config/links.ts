// Assets
import adminImage from "@assets/admin/admin.jpg"
import analyticsImage from "@assets/admin/analytics.jpg"
import busFleetImage from "@assets/admin/bus-fleet.jpg"
import busInRouteImage from "@assets/admin/bus-in-route.jpg"
import busDriverImage from "@assets/admin/bus-driver.jpg"
import mapImage from "@assets/admin/map.jpg"

type ImageLink = string

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
    background: busInRouteImage,
    goesTo: '/viagens',
  },
  {
    title: "Gestão de Veículos",
    description: "Gerencie seus veículos.",
    background: busFleetImage,
    goesTo: '/adminbus',
  },
  {
    title: "Equipe de Motoristas",
    description: "Gerencie sua equipe.",
    background: busDriverImage,
    goesTo: 'motoristas',
  },
  {
    title: "Malha de Rotas",
    description: "Crie novos trajetos, defina novas paradas.",
    background: mapImage,
    goesTo: 'rotas',
  },
  {
    title: "Administradores",
    description: "Conceda privilégios de gestão a novos usuários.",
    background: adminImage,
    goesTo: 'administradores',
  },
  {
    title: "Relatórios Gerais",
    description: "Estatísticas de uso e eficiência da frota.",
    background: analyticsImage,
    goesTo: 'relatorios',
  },
]
