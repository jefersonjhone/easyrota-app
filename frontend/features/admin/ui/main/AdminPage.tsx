// Configs
import { actions } from '@/features/admin/config/actions'

// Components
import AppLayout from '@layout/app-layout'
import { Link } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Separator } from '@ui/separator'


const AdminPage = () => (
  <AppLayout>
    <h1 className="text-center text-3xl sm:text-4xl font-heading font-medium">Painel de Controle</h1>
    <Separator className="max-w-xl mx-auto" />
     <section className="mx-auto grid w-full max-w-3xl grid-cols-1 sm:grid-cols-3 gap-6 px-4 sm:px-0">
        {actions.map((link) => (
          <Link to={link.route.to} key={link.title} 
            className="w-full hover:scale-[1.02] transition-transform group">
            <Card size="sm" key={link.title} 
              className="flex flex-col overflow-hidden 
                ring-0 ring-primary 
                group-hover:ring-1 transition-all duration-300 ease-in-out">
              <img src={link.background} alt={link.title}
                className="w-full h-30 sm:aspect-video object-cover 
                  brightness-80 dark:brightness-40 grayscale group-hover:grayscale-0
                  transition-all duration-300"/>
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
  </AppLayout>
)

export default AdminPage