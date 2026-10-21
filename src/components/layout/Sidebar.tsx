import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { signOut } from '@/lib/auth'
import { NAV_ITEMS } from './navItems'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#163C35] bg-[#08130E] p-4 md:flex">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-2 py-6">
        <img 
          src="/gawa-logo.png" 
          alt="Gawa" 
          className="h-10 w-auto object-contain" 
        />
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="mt-4 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0B3D2E] text-[#4ADE80]'
                      : 'text-[#8A9C92] hover:bg-[#0F241A] hover:text-white'
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#8A9C92] hover:bg-[#0F241A] hover:text-white"
        >
          <LogOut size={18} aria-hidden="true" /> Sign out
        </button>
      </div>

      {/* FULL-SIZE IMAGE EXPERIENCE */}
      <div className="relative mt-auto h-64 w-full overflow-hidden rounded-2xl border border-[#163C35]">
        <img 
          src="/sidebar-bg.jpg" 
          alt="Journey" 
          className="absolute inset-0 h-full w-full object-cover object-center" 
        />
        {/* This gradient ensures the text is readable while showing the road */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08130E] via-[#08130E]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-5">
          <p className="text-sm font-medium text-white">Better Money.</p>
          <p className="text-base font-bold text-[#4ADE80]">Bigger Dreams.</p>
        </div>
      </div>
    </aside>
  )
}