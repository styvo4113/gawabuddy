import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AddMenuSheet, AddType, TransactionAddType } from '@/components/AddMenuSheet'
import { AddGoalSheet } from '@/components/savings/AddGoalSheet'
import { AddDebtSheet } from '@/components/debts/AddDebtSheet'
import { AddFutureItemSheet } from '@/components/wishlist/AddFutureItemSheet'
import { AddSheet } from '@/components/transactions/AddSheet'
import { AddBillSheet } from '@/components/bills/AddBillSheet'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'
import { FloatingAddButton } from './FloatingAddButton'
import { PinGate } from '@/components/security/PinGate'
import { SettingsSync } from '@/components/SettingsSync'
import { OfflineBanner } from '@/components/pwa/OfflineBanner'
import { PwaUpdatePrompt } from '@/components/pwa/PwaUpdatePrompt'

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [debtOpen, setDebtOpen] = useState(false)
  const [futureOpen, setFutureOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: TransactionAddType }>({ open: false, type: 'expense' })

  return (
    <PinGate>
      <SettingsSync>
        <div className="flex min-h-screen bg-[#F8F5EC] text-[#1F2937] dark:bg-[#031310] dark:text-[#F5F8F7]">
          <OfflineBanner />

          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col md:pl-64">
            {/* Mobile Top Navigation */}
            <div className="md:hidden">
              <TopNav />
            </div>
            
            <main className="flex-1 pb-24 md:pb-0">
              <Outlet />
            </main>
          </div>

          {/* Floating Add Button (MOBILE ONLY) */}
          <div className="md:hidden">
            <FloatingAddButton onClick={() => setMenuOpen(true)} />
          </div>
          
          <AddMenuSheet open={menuOpen} onOpenChange={setMenuOpen} onPick={(type: AddType) => {
            setMenuOpen(false)
            if (type === 'savings_goal') setGoalOpen(true)
            else if (type === 'debt') setDebtOpen(true)
            else if (type === 'future_item') setFutureOpen(true)
            else if (type === 'bill') setBillOpen(true)
            else setQuickAdd({ open: true, type })
          }} />
          <AddSheet open={quickAdd.open} onOpenChange={(o) => setQuickAdd((s) => ({ ...s, open: o }))} defaultType={quickAdd.type} />
          <AddGoalSheet open={goalOpen} onOpenChange={setGoalOpen} />
          <AddDebtSheet open={debtOpen} onOpenChange={setDebtOpen} />
          <AddFutureItemSheet open={futureOpen} onOpenChange={setFutureOpen} />
          <AddBillSheet open={billOpen} onOpenChange={setBillOpen} />
          <PwaUpdatePrompt />
        </div>
      </SettingsSync>
    </PinGate>
  )
}