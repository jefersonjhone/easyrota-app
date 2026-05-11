// Configs
import { actions } from '@features/admin/config/links'

// Components
import AppLayout from '@layout/app-layout'
import { Link } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card'
import { Separator } from '@ui/separator'


const AdminPage = () => (
  <AppLayout>
    <h1 className="text-center text-3xl sm:text-4xl font-heading font-medium">Painel de Controle</h1>
    <p className="text-center text-sm sm:text-base font-heading">
      Bem-vindo ao centro de gestão {" "}
      <span>EasyRota</span> {" "}
      Uninfra
    </p>
    <Separator className="max-w-xl mx-auto" />
     <section className="mx-auto grid w-full max-w-3xl grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
        {actions.map((link) => (
          <Card key={link.title} className="flex flex-col overflow-hidden rounded-lg">
            <img src={link.background} alt={link.title}
              className="w-full h-40 sm:aspect-video object-cover brightness-80 grayscale dark:brightness-40"/>
            <CardHeader>
              <CardTitle>{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Link to={link.route.to} className="w-full">
                <Button className="w-full">Gerenciar</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>
  </AppLayout>
)

export default AdminPage