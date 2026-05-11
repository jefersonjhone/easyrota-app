import { Toolbar } from '@/features/admin/ui/Toolbar'
import AppLayout from '@/lib/layout/app-layout'


export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout>
      <Toolbar></Toolbar>
      <main className="flex w-full flex-col items-center justify-start gap-4">
        { children }
      </main>
    </AppLayout>
  )
}