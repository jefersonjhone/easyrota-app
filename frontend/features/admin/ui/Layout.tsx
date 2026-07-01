import AppLayout from '@/lib/layout/app-layout'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/lib/ui/sidebar"
import { AppSidebar } from "@/features/admin/ui/AppSidebar"
import { TooltipProvider } from "@/lib/ui/tooltip"

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout showBottomNav={false}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-1 flex-col max-w-300 mx-auto relative">
              <header className="flex items-center px-2 sticky top-18 z-50">
                <SidebarTrigger className="min-h-[44px] min-w-[44px] h-10 w-10 p-0 text-xl md:hidden bg-muted rounded-lg" />
              </header>
              <main className="flex-1 overflow-auto p-4 md:p-8 justify-center">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </AppLayout>
  )
}
