import { LayoutDashboard, Receipt, PieChart, Target, Compass, CalendarClock, BarChart3, Settings, User, type LucideIcon } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/goals', label: 'Savings & Goals', icon: Target },
  { to: '/planner', label: 'Financial Planner', icon: Compass },
  { to: '/bills', label: 'Bills', icon: CalendarClock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]