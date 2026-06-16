import Header from "@layout/header"
import Footer from "@layout/footer"
import { useAuthStore } from "@/features/auth/store/auth-store"

const paths = {
  passager: "/app",
  driver: "/app/driver/viagens",
  admin: "/admin"
}

type LayoutProps = {
  children: React.ReactNode
  showFooter?: boolean
}

const AppLayout = ({ children, showFooter = true }: LayoutProps) => {
  const user = useAuthStore((state) => state.user)
  const userTypes = user?.profile_type === "STUDENT" || user?.profile_type === "CIVIL-SERVANT" ? "passager" : user?.profile_type;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header 
        description="Sistema de gerenciamento de rotas"
        user={{name: user?.full_name || 'Usuário', kind: userTypes?.toLocaleLowerCase()} as any}
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