import logo from "@/assets/logo-light-mode.svg"

const Header = () => {
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
              Gestão de presença e viagem
            </p>
          </div>
        </a>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href="/login">Entrar</a>
          </Button>
          <Button asChild size="sm">
            <a href="/admin">Painel</a>
          </Button>
        </div>
      </div>
    </header>
  )
}

const Footer = () => {
  return (
    <footer className="flex items-center justify-center-safe gap-4 p-2 border-t border-border">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EasyRota. Todos os direitos reservados.
      </p>
    </footer>
  )
}

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default AppLayout