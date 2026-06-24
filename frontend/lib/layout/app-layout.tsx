import Header from "@layout/header"
import Footer from "@layout/footer"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { BottomNav } from "@layout/bottom-nav"

const paths = {
  passager: "/app",
  driver: "/app/driver/viagens",
  admin: "/admin"
}

type LayoutProps = {
  children: React.ReactNode
}

const AppLayout = ({ children, showFooter = true }: LayoutProps) => {
  const user = useAuthStore((state) => state.user)
  const userTypes = user?.profile_type === "STUDENT" || user?.profile_type === "CIVIL-SERVANT" ? "passager" : user?.profile_type?.toLowerCase();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header 
        description="Sistema de gerenciamento de rotas"
        user={{name: user?.full_name || 'Usuário', kind: userTypes as 'passager' | 'admin' | 'driver'}}
        paths={paths}
      />
      <main className="flex-1 flex flex-col gap-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

export default AppLayout
