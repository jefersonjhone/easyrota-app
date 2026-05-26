import {
  GearIcon,
  CaretUpDownIcon,
  SignOutIcon,
  UserCircleIcon,
  LifebuoyIcon,
  WarningIcon
} from "@phosphor-icons/react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/lib/ui/sidebar"
import type{ AuthUser } from "@/features/auth/types/auth"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { Link } from "@tanstack/react-router"
import { useLogoutMutation } from '@/features/auth/hooks/useLogout'


export function NavUser() {
  const { isMobile } = useSidebar()
  const user: AuthUser = useAuthUser()
  const avatarFallback = user?.full_name?.split(" ").map((name) => name[0]).join("").toUpperCase()

  const logoutMutation = useLogoutMutation()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <CaretUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={"/avatar.png"} alt={user?.full_name} />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.full_name}</span>
                  <span className="truncate text-xs "> {user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                ACCOUNT
              </DropdownMenuLabel>
              <Link to="/app/perfil">
                <DropdownMenuItem>
                    <UserCircleIcon />
                    Profile
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <GearIcon />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {
              /* DESATIVANDO PQ NÃO TEMOS NENHUMA
              FEATURE RELACIONADA AINDA              
              MAS CASO TENHAMOS, JÁ ESTÁ PRONTO
              
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
              <DropdownMenuLabel>
              SYSTEM
              </DropdownMenuLabel>
              <DropdownMenuItem>
                <KeyIcon />
                Permissions
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <ClockCheckIcon />
                Activity
              </DropdownMenuItem>
            </DropdownMenuGroup>
              <DropdownMenuSeparator />
              */
              }
              <DropdownMenuGroup>
              <DropdownMenuLabel>
                SUPPORT
                </DropdownMenuLabel>
              <DropdownMenuItem>
                <LifebuoyIcon />
                Help
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <WarningIcon />
                Report issue
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
              <SignOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}