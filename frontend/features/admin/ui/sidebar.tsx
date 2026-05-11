import { Link } from '@tanstack/react-router'
import { actions } from '../config/actions'
import { Button } from '@/lib/ui/button'

export const Sidebar = () => {
  return (
    <aside className="flex h-full self-stretch">
      <nav className="flex h-full flex-col justify-center p-4 gap-4 border-r-2 border-secondary">
        {actions.map((action) => (
          <Link to={action.route.to}>
            <Button variant="outline" className="w-full justify-start">
              {action.title}
            </Button>
          </Link>
        ))}
      </nav>
    </aside>
  )
}