import AppLayout from '@/lib/layout/app-layout'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/lib/ui/sidebar"
import { AppSidebar } from "@/features/admin/ui/AppSidebar"
import { TooltipProvider } from "@/lib/ui/tooltip"


export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout>
      <TooltipProvider>
    <SidebarProvider>
           <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-1 flex-col max-w-300 mx-auto relative ">
               <header className="flex items-center -b px-2 sticky top-18  z-50 ">
                 <SidebarTrigger className='h-12 w-12 p-0 text-2xl md:hidden bg-gray-100 rounded-sm'/>
               </header>
               <main className="flex-1 overflow-auto p-2 md:p-6 justify-center">
                 {children}
               </main>
            </SidebarInset>
           </div>
       </SidebarProvider>
    </TooltipProvider>
    </AppLayout>
  )
}