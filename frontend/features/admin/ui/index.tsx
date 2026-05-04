// Configs
import { links } from '@features/admin/config/links'

// Components
import { Link } from '@tanstack/react-router'
import AppLayout from '@layout/app-layout'
import { Button } from '@ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card'
import { Separator } from '@ui/separator'


const AdminPage = () => (
  <AppLayout>
    <h1 className="text-center text-4xl font-heading font-medium">Painel de Controle</h1>
    <p className="text-center font-heading font-base">
      Bem-vindo ao centro de gestão {" "} 
      <span>EasyRota</span> {" "} 
      Uninfra
    </p>
    <Separator className="max-w-xl mx-auto" />
     <section className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-8 px-4">
        {links.map((link) => (
          <Card key={link.title} className="flex flex-col">
            <img src={link.background} alt={link.title} 
              className="aspect-video object-cover brightness-80 grayscale dark:brightness-40"/>
            <CardHeader>
              <CardTitle>{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Link to={link.goesTo} className="w-full">
                <Button className="w-full">Gerenciar</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>
  </AppLayout>
)

export default AdminPage