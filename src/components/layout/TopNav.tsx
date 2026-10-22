import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, PieChart, Target, MoreHorizontal, LogOut, Settings, X, Compass, CalendarClock, BarChart3, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { signOut } from '@/lib/auth'

const MENU = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/goals', label: 'Savings & Goals', icon: Target },
  { to: '/planner', label: 'Financial Planner', icon: Compass },
  { to: '/bills', label: 'Bills', icon: CalendarClock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function TopNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[#F8F5EC]/90 px-4 py-3 backdrop-blur-md dark:bg-[#031310]/90 md:pl-4">
        
        <div className="flex items-center gap-2">
          
          {/* 1. IMAGE OPENS THE MENU */}
          <button 
            onClick={() => setOpen(true)} 
            className="active:scale-95 transition-transform"
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="h-10 w-10 rounded-full object-cover border-2 border-[#EFEAD8] dark:border-[#243b30]" 
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E8E3E] text-sm font-bold text-white dark:bg-[#4ADE80] dark:text-[#031310]">
                {profile?.full_name?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
          </button>

          {/* 2. GAWABUDDY + ARROW GOES TO DASHBOARD */}
          <Link to="/" className="flex items-center gap-1 active:scale-95 transition-transform">
            <span className="text-lg font-bold text-[#0B3D2E] dark:text-[#f1ecdc]">GawaBuddy</span>
            <ChevronRight size={18} className="text-[#6B7280] dark:text-[#A9B8AF]" />
          </Link>
        </div>

        {/* Right Side: Menu Button (Optional backup trigger) */}
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-[#6B7280] hover:bg-[#EFEAD8] dark:text-[#A9B8AF] dark:hover:bg-[#163C35]">
          <MoreHorizontal size={24} />
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute left-4 top-4 w-64 overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-[#14291f]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F1ECDC] p-4 dark:border-[#243b30]">
              <div className="min-w-0 flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="h-10 w-10 rounded-full object-cover border border-[#EFEAD8] dark:border-[#243b30]" 
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E8E3E] text-sm font-bold text-white dark:bg-[#4ADE80] dark:text-[#031310]">
                    {profile?.full_name?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[#1F2937] dark:text-white">My Account</p>
                  <p className="truncate text-xs text-[#6B7280] dark:text-[#A9B8AF]">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-[#F1ECDC] dark:hover:bg-[#243b30]"><X size={20} className="text-[#6B7280] dark:text-[#A9B8AF]" /></button>
            </div>
            <nav className="p-2">
              {MENU.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F8F5EC] dark:text-[#dad5c3] dark:hover:bg-[#1f362b]">
                  <item.icon size={18} className="text-[#0B3D2E] dark:text-[#4ADE80]" />{item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-[#F1ECDC] p-2 dark:border-[#243b30]">
              <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#C0392B] hover:bg-[#C0392B]/10">
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}