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
      className={`fixed left-0 top-1/2 transform -translate-y-1/2 flex h-auto transition-opacity duration-200 ${
        isOverlapping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <nav className="flex flex-col justify-center p-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.title} to={action.route.to}>
              <Button variant="outline" className="w-full justify-start items-center gap-2">
                <Icon className="size-5" />
                {action.title}
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}