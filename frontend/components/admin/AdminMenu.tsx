import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import type { FC, ReactElement } from "react"

import adminImage from "@/assets/admin/admin.jpg"
import analyticsImage from "@/assets/admin/analytics.jpg"
import busFleetImage from "@/assets/admin/bus-fleet.jpg"
import busInRouteImage from "@/assets/admin/bus-in-route.jpg"
import busDriverImage from "@/assets/admin/bus-driver.jpg"
import mapImage from "@/assets/admin/map.jpg"

type ActionProps = {
  title: string
  href: string
  img: string
  children: ReactElement
}

type ActionData = {
  title: string
  description: string
  background: string
  goesTo: string
}

const Action = ({ title, href, img, children  }: ActionProps) => {
  return (
    <Card className="relative flex h-full w-full flex-col pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={img}
        alt={title}
        className="relative z-20 aspect-video w-full object-cover brightness-80 grayscale dark:brightness-40"
      />
      <CardHeader className="flex-1">
        <CardAction>
          {/* <Badge variant="secondary">Featured</Badge> */}
        </CardAction>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{children}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Link to={href} className="w-full">
          <Button className="w-full cursor-pointer">
            Gerenciar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

type MenuProps = {
  paths: {
    travel: string
    buses: string
    drivers: string
    routes: string
    admins: string
    analytics: string
  }
}

const AdminMenu: FC<MenuProps> = ({ paths }) => {

  const actions: ActionData[] = [
    { 
      title: "Frota Ativa",
      description: "Veja a ocupação em tempo real.",
      background: busInRouteImage,
      goesTo: paths.travel,
    },
    {
      title: "Gestão de Veículos",
      description: "Gerencie seus veículos.",
      background: busFleetImage,
      goesTo: paths.buses,
    },
    {
      title: "Equipe de Motoristas",
      description: "Gerencie sua equipe.",
      background: busDriverImage,
      goesTo: paths.drivers,
    },
    {
      title: "Malha de Rotas",
      description: "Crie novos trajetos, defina novas paradas.",
      background: mapImage,
      goesTo: paths.routes,
    },
    {
      title: "Administradores",
      description: "Conceda privilégios de gestão a novos usuários.",
      background: adminImage,
      goesTo: paths.admins,
    },
    {
      title: "Relatórios Gerais",
      description: "Estatísticas de uso e eficiência da frota.",
      background: analyticsImage,
      goesTo: paths.analytics,
    },
  ]

  return (
    <main className="flex flex-col gap-6 py-10">
      <h1 className="text-center text-4xl font-heading font-medium">Painel de Controle</h1>
      <p className="text-center font-heading font-base">
        Bem-vindo ao centro de gestão {" "} 
        <span>EasyRota</span> {" "} 
        Uninfra
      </p>
      <Separator className="max-w-xl mx-auto" />
      <section className="mx-auto grid w-full max-w-3xl grid-cols-2 items-stretch gap-8 px-4">

      {actions.map(({ title, description, background, goesTo }) => (
        <Action key={title} title={title} href={goesTo} img={background}>
          <p>{description}</p>
        </Action>
      ))}
      </section>
    </main>
  )
}

export default AdminMenu