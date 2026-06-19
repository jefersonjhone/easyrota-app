import logo from "@assets/logo-light-mode.svg"

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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8 md:py-4">
        <a href={paths[user?.kind || 'passager']} className="flex items-center gap-2 rounded-2xl text-foreground transition-colors hover:text-primary md:gap-3">
          <img src={logo} alt="EasyRota" className="h-8 w-8 md:h-10 md:w-10" />
          <div className="leading-none">
            <h1 className="font-heading text-sm font-semibold tracking-tight md:text-lg">
              <span className="text-primary">Easy</span>
              <span>Rota</span>
            </h1>
            <p className="text-[10px] text-muted-foreground md:text-xs">
              {description}
            </p>
          </div>
        </a>
      </div>
    </header>
  )
}

export default Header
