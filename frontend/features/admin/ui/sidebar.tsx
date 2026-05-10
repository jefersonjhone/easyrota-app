import { Link } from '@tanstack/react-router'
import { links } from '../config/links'
import { useState } from 'react'

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="md:hidden fixed top-4 right-4 z- bg-[#bd4b00] text-white p-2 rounded-lg font-bold"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'FECHAR' : 'MENU'}
      </button>

      <aside className={`
        fixed left-0 top-0 h-screen bg-white border-r border-border flex flex-col z-50 transition-transform duration-300
        w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-8 border-b border-border text-xl font-heading font-bold text-[#bd4b00]">
          EasyRota ADM
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.goesTo}
              to={link.goesTo}
              onClick={() => setIsOpen(false)}
              activeProps={{ className: "bg-[#bd4b00] text-white" }}
              className="flex items-center px-4 py-3 rounded-xl text-muted-foreground hover:bg-[#f2f2ee] transition-all font-medium uppercase text-xs"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}