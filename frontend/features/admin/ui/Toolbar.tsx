import { Link } from '@tanstack/react-router'
import { actions } from '../config/actions'
import { Button } from '@/lib/ui/button'
import { useRef } from 'react'
import useFooterOverlap from '@/lib/hooks/useFooterOverlap'

export const Toolbar = () => {
  const component = useRef(null)
  const isOverlapping = useFooterOverlap(component)

  return (
    <aside
      ref={component}
      className={`fixed inset-x-0 bottom-0 z-40 flex h-auto transition-opacity duration-200 md:inset-x-auto md:left-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 ${
        isOverlapping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <nav className="flex w-full flex-row justify-center gap-3 overflow-x-auto border-t border-border bg-background/95 px-3 py-3 backdrop-blur md:w-auto md:flex-col md:justify-center md:border-t-0 md:bg-transparent md:p-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.title} to={action.route.to}>
              <Button
                variant="outline"
                aria-label={action.title}
                className="w-auto shrink-0 items-center gap-2 justify-center md:w-full md:justify-start"
              >
                <Icon className="size-5" />
                <span className="hidden xl:inline">{action.title}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}