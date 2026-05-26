import Header from "@layout/header"
import Footer from "@layout/footer"

const paths = {
  passager: "/app",
  driver: "/driver",
  admin: "/admin"
}

type LayoutProps = {
  children: React.ReactNode
  showFooter?: boolean
}

const AppLayout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header 
        description="Sistema de gerenciamento de rotas"
        paths={paths}
      />
      <main className="flex-1 flex flex-col gap-6 ">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

export default AppLayout