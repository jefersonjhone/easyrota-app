import logo from "@/assets/logo-light-mode.svg"

const Header = () => {
  return (
    <header className="flex items-center justify-center-safe gap-4 p-2 border-b border-border">
      <img src={logo} alt="Logo" className="w-12 h-12" />
      <h1 className="font-heading font-black">
        <span className="text-primary">Easy</span>
        <span className="text-chart-5">Rota</span>
      </h1>
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