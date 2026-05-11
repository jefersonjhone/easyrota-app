import { Toolbar } from '@/features/admin/ui/Toolbar'
import AppLayout from '@/lib/layout/app-layout'


export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout>
      <Toolbar />
      <main className="flex w-full flex-1 flex-col items-center justify-start gap-4 px-4 pb-24 md:pb-10 lg:px-8">
        { children }
      </main>
    </AppLayout>
  )
}