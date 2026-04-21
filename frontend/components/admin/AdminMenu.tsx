import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import type { ReactElement } from "react"

type ActionProps = {
  title: string
  href: string
  children: ReactElement
}

const Action = ({ title, href, children  }: ActionProps) => {
  return (
    <Card className="relative flex h-full w-full flex-col pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src="https://avatar.vercel.sh/shadcn1"
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
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
          <Button className="w-full cursor-pointer" variant="outline">
            Gerenciar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}



const AdminMenu = () => {
  return (
    <main className="container mx-auto max-w-5xl flex flex-col gap-6 py-10">
      <h1 className="text-center text-4xl">Painel de Controle</h1>
      <p className="text-center">
        Bem-vindo ao centro de gestão {" "} 
        <span>EasyRota</span> {" "} 
        Uninfra
      </p>
      <Separator />
      <section className="mx-auto grid w-full max-w-3xl grid-cols-2 items-stretch gap-8 px-4">
        <Action title="Frota Ativa" href="/travel">
          <p>Veja a ocupação em tempo real.</p>
        </Action>
        <Action title="Gestão de Veículos" href="/admin/buses">
          <p>Gerencie seus veículos.</p>
        </Action>
        <Action title="Equipe de Motoristas" href="/admin/drivers">
          <p>Gerencie sua equipe.</p>
        </Action>
        <Action title="Malha de Rotas" href="/admin/routes">
          <p>Crie novos trajetos, defina novas paradas.</p>
        </Action>
        <Action title="Administradores" href="/admin/admins">
          <p>Conceda privilégios de gestão a novos usuários.</p>
        </Action>
        <Action title="Relatórios Gerais" href="/admin/reports">
          <p>Estatísticas de uso e eficiência da frota.</p>
        </Action>
      </section>
    </main>
  )
}

export default AdminMenu