import React from 'react'
import { Sidebar } from './sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-10 md:ml-64 overflow-y-auto w-full">
        <header className="mb-8 mt-12 md:mt-0 text-left">
          <h1 className="text-2xl md:text-4xl font-heading font-medium text-foreground">{title}</h1>
          {description && <p className="text-sm md:text-base text-muted-foreground mt-1">{description}</p>}
        </header>
        {children}
      </main>
    </div>
  )
}