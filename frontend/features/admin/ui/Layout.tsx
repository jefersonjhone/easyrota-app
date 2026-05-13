import { Toolbar } from '@/features/admin/ui/Toolbar'
import AppLayout from '@/lib/layout/app-layout'


export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout>
      <Toolbar />
      <main className="flex w-full min-h-dvh flex-1 flex-col items-center justify-start gap-4 px-4 pb-24 lg:px-8 lg:pb-10">
        { children }
      </main>
    </AppLayout>
  )
}