import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarTrigger,
} from "@/lib/ui/sidebar"
import { Bus, WarningCircle, ClockCounterClockwise, GraduationCap } from "@phosphor-icons/react"
import { SteeringWheel, MapTrifold, Path, Gauge, CalendarCheck, ShieldCheck, UserCircleCheck, EnvelopeOpen} from "@phosphor-icons/react"
import { Link, useLocation } from "@tanstack/react-router"
import { NavUser } from "./navUser"

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname

  const frotaItems = [
    { title:"Gerenciar Onibus", icon:Bus, url:"/admin/onibus" },
    { title:"Gerenciar Motoristas", icon:SteeringWheel, url:"/admin/motoristas" },
    { title:"Gerenciar Administradores", icon:ShieldCheck, url:"/admin/administradores" },
  ]
  const ViagensItems = [
    { title:"Gerenciar Viagens", icon:MapTrifold, url:"/admin/viagens", exact: true },
    { title:"Historico de Viagens", icon:ClockCounterClockwise, url:"/admin/viagens/historico" },
    { title:"Gerenciar Rotas", icon:Path, url:"/admin/rotas" },
    {title:"Solicitações de Viagem", icon:EnvelopeOpen, url:"/admin/solicitacoes"},
  ]
  const UsersItems = [
    { title:"Gerenciar Estudantes", icon:GraduationCap, url:"/admin/estudantes" },
    { title:"Gerenciar Servidores", icon:UserCircleCheck, url:"/admin/servidores" },
    { title:"Gerenciar Reservas", icon:CalendarCheck, url:"/admin/reservas" },
    { title:"Gerenciar Penalidades", icon:WarningCircle, url:"/admin/penalidades" },
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="top-20 h-[calc(100svh-4rem)] w-72">
      <div className="flex items-center justify-end border-b w-full p-0">
        <SidebarTrigger className="data-[state=open]:hidden p-2 w-10 h-10" />
      </div>
      <SidebarContent>
        <SidebarHeader>
          <NavUser />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === "/admin"}>
                  <Link to="/admin">
                    <Gauge weight="duotone" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Frota e Pessoal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {frotaItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url || pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon weight="duotone" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Viagens e Rotas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ViagensItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon weight="duotone" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Usuarios e Reservas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {UsersItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url || pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon weight="duotone" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
