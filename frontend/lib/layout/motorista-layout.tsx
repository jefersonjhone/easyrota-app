import Header from '@layout/header'
import { MotoristaBottomNav } from '@layout/motorista-bottom-nav'

const paths = {
  passager: '/app',
  driver: '/app/motorista',
  admin: '/admin',
}

type MotoristaLayoutProps = {
  children: React.ReactNode
}

const MotoristaLayout = ({ children }: MotoristaLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        description="Sistema de gerenciamento de rotas"
        paths={paths}
      />
      <main className="flex-1 flex flex-col gap-6 pb-24">
        {children}
      </main>
      <MotoristaBottomNav />
    </div>
  )
}

export default MotoristaLayout
