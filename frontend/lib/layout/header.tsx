import logo from "@assets/logo-light-mode.svg"

type User = {
  name: string
  kind: 'passager' | 'admin' | 'driver'
}

type Props = {
  description: string
  user?: User | undefined
  paths: {
    passager: string
    driver: string
    admin: string
  }
}

const Header = ({ description, user, paths }: Props) => {
    return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-5">
           <a href={paths[user?.kind || 'passager']} className="flex items-center gap-3 rounded-2xl text-foreground transition-colors hover:text-primary">
            <img src={logo} alt="EasyRota" className="h-8 w-8 sm:h-10 sm:w-10" />
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
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        </div>
      </div>
    </header>
  )
}

export default Header
