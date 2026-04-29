import logo from "@/assets/logo-light-mode.svg"
import { Button } from "@/components/ui/button"

type User = {
  name: string
  kind: 'passager' | 'driver' | 'admin'
}

type Props = {
  description: string
  user?: User
  paths: {
    passager: string
    driver: string
    admin: string
  }
}

const Header = ({ description, user, paths }: Props) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3 rounded-2xl text-foreground transition-colors hover:text-primary">
          <img src={logo} alt="EasyRota" className="h-10 w-10" />
          <div className="leading-none">
            <h1 className="font-heading text-lg font-semibold tracking-tight">
              <span className="text-primary">Easy</span>
              <span>Rota</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href="/profile">Perfil</a>
          </Button>
          <Button asChild size="sm">
            <a href={paths[user?.kind || 'passager']}>
              Painel
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header