import { useLocation, Link } from '@tanstack/react-router'
import {
  House,
  Bus,
  ClipboardText,
  ClockClockwise,
  User,
} from '@phosphor-icons/react'

const navItems = [
  { to: '/app', label: 'Início', icon: House },
  { to: '/app/viagens', label: 'Viagens', icon: Bus },
  { to: '/app/reservas', label: 'Reservas', icon: ClipboardText },
  { to: '/app/historico', label: 'Histórico', icon: ClockClockwise },
  { to: '/app/perfil', label: 'Perfil', icon: User },
] as const

function isActive(itemTo: string, currentPath: string) {
  if (itemTo === '/app') {
    return currentPath === '/app/' || currentPath === '/app'
  }
  return currentPath === itemTo || currentPath.startsWith(itemTo + '/')
}

export function BottomNav() {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = isActive(item.to, currentPath)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-1 flex-col items-center gap-1 py-3 min-w-0 transition-colors active:scale-95"
            >
              <Icon
                size={26}
                weight={active ? 'fill' : 'regular'}
                className={active ? 'text-primary' : 'text-muted-foreground'}
              />
              <span
                className={`text-[12px] md:text-[13px] font-semibold leading-tight ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
