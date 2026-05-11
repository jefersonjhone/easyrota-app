import { Link } from '@tanstack/react-router'
import { actions } from '../config/actions'
import { Button } from '@/lib/ui/button'

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-1/2 transform -translate-y-1/2 flex h-auto">
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