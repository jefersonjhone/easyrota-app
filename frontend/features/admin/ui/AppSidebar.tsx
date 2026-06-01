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
import { BusIcon } from "@phosphor-icons/react"
import { SteeringWheel } from "@phosphor-icons/react"
import {MapTrifold} from "@phosphor-icons/react"
import {  Path} from "@phosphor-icons/react"
import { Gauge } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"
import { NavUser } from "./navUser"
import { useLocation } from "@tanstack/react-router"


export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname

  const frotaItems = [
    {title:"Gerenciar Ônibus", icon:BusIcon, url:"/admin/onibus"},
    {title:"Gerenciar Motoristas", icon:SteeringWheel, url:"/admin/motoristas"},
  ]
  const ViagensItems = [
    {title:"Gerenciar Viagens", icon:MapTrifold, url:"/admin/viagens"},
    {title:"Gerenciar Rotas", icon:Path, url:"/admin/rotas"},
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="top-20 h-[calc(100svh-4rem)] w-72" >
          <div className="flex items-center justify-end border-b w-full p-0">
              <SidebarTrigger className="data-[state=open]:hidden p-2 w-12 h-12" />
            </div>
            
      <SidebarContent>
        <SidebarHeader>
          <NavUser  />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="font-lg text-semibold">
              <SidebarMenuItem key="Dashboard">
                <SidebarMenuButton asChild tooltip="Dashboard" size="default" isActive={pathname === "/admin"}>
                  <Link to="/admin">
                    <Gauge />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span>Frota e Pessoal</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="font-lg text-semibold">
              {frotaItems.map((item) => (
                <SidebarMenuItem key={item.title} >
                  <SidebarMenuButton asChild tooltip={item.title} size="default" isActive={pathname === item.url ||
                                    pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span>Viagens e Rotas</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ViagensItems.map((item) => (
                <SidebarMenuItem key={item.title} >
                  <SidebarMenuButton asChild tooltip={item.title} size="default" isActive={pathname === item.url ||
                              pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
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