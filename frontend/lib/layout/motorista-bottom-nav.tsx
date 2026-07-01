import { useLocation, Link } from '@tanstack/react-router'
import { Bus, User } from '@phosphor-icons/react'

const navItems = [
  { to: '/app/motorista', label: 'Viagens', icon: Bus },
  { to: '/app/motorista/perfil', label: 'Perfil', icon: User },
] as const

function isActive(itemTo: string, currentPath: string) {
  if (itemTo === '/app/motorista') {
    return currentPath === '/app/motorista' || currentPath === '/app/motorista/'
  }
  return currentPath === itemTo || currentPath.startsWith(itemTo + '/')
}

export function MotoristaBottomNav() {
  const location = useLocation()
  const currentPath = location.pathname

  const activeIndex = navItems.findIndex((item) => isActive(item.to, currentPath))
  const safeIndex = activeIndex === -1 ? 0 : activeIndex

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 rounded-2xl border border-border/70 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 shadow-sm">
      <div className="relative flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        <div
          className="absolute top-0 h-1 rounded-full bg-primary transition-all duration-1000 ease-in-out"
          style={{
            width: `calc(100% / ${navItems.length} - 0.75rem)`,
            left: `calc(100% / ${navItems.length} * ${safeIndex} + 0.375rem)`,
          }}
        />
        {navItems.map((item) => {
          const active = isActive(item.to, currentPath)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 min-w-0 transition-all duration-300 active:scale-95 ${
                active ? 'scale-110 opacity-100' : 'opacity-60'
              }`}
            >
              <Icon
                size={26}
                weight={active ? 'fill' : 'regular'}
                className={`transition-all duration-300 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-[12px] md:text-[13px] font-semibold leading-tight transition-all duration-300 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
