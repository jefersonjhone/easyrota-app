import Header from '@layout/header'

const paths = {
  passager: '/app',
  driver: '/app/driver/viagens',
  admin: '/admin',
}

type MotoraLayoutProps = {
  children: React.ReactNode
  user?: {
    name: string
    kind: 'passager' | 'driver' | 'admin'
  }
}

const MotoraLayout = ({ children, user }: MotoraLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header description="Sistema de gerenciamento de rotas" user={user} paths={paths} />
      <main className="flex-1 flex flex-col gap-6 py-10">{children}</main>
    </div>
  )
}

export default MotoraLayout
