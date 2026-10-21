import { useState } from 'react'
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/money'
import { GROUPS, currentMonthKey, monthLabel, shiftMonth, usedPct } from '@/lib/budgetMath'
import { BudgetLine, BudgetSave, summarize, useBudget, useSaveBudgets } from '@/hooks/useBudget'
import { useProfile } from '@/hooks/useProfile'
import { useMonthTotals } from '@/hooks/useDashboard'
import { usePinEnabled } from '@/lib/pin'
import { BudgetBar } from '@/components/budget/BudgetBar'
import { CategoryBudgetRow } from '@/components/budget/CategoryBudgetRow'
import { ApplyPlanDialog } from '@/components/budget/ApplyPlanDialog'

export default function Budget() {
  const [month, setMonth] = useState(currentMonthKey())
  const [planOpen, setPlanOpen] = useState(false)
  const { lines, isLoading, error } = useBudget(month)
  const save = useSaveBudgets(month)
  const { data: profile } = useProfile()
  const { data: totals } = useMonthTotals(month, shiftMonth(month, 1))
  const pinOn = usePinEnabled()

  const total = summarize(lines)
  
  function saveRows(rows: BudgetSave[], okMsg?: string, after?: () => void) {
    save.mutate(rows, { onSuccess: () => { if (okMsg) toast.success(okMsg); after?.() }, onError: () => toast.error('Could not save your budget. Try again.') })
  }
  
  const setLimit = (l: BudgetLine, cents: number) => saveRows([{ category_id: l.categoryId, limit_cents: cents, rollover: l.rollover }])
  const setRollover = (l: BudgetLine, on: boolean) => saveRows([{ category_id: l.categoryId, limit_cents: l.limit, rollover: on }])

  const monthlyIncome = profile?.monthly_income || totals?.income || 0

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))} className="rounded-full p-2 text-[#0B3D2E] hover:bg-[#0B3D2E]/10"><ChevronLeft size={20} /></button>
        <h1 className="text-base font-semibold text-[#0B3D2E] dark:text-white">{monthLabel(month)}</h1>
        <button type="button" aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))} className="rounded-full p-2 text-[#0B3D2E] hover:bg-[#0B3D2E]/10"><ChevronRight size={20} /></button>
      </div>
      
      {error && (<p className="rounded-xl bg-[#C0392B]/10 p-3 text-sm text-[#C0392B]">Could not load your budget. Pull to refresh or try again.</p>)}
      
      {isLoading ? (
        <div className="space-y-3"><div className="h-24 animate-pulse rounded-2xl bg-white/70 dark:bg-[#14291f]" /><div className="h-48 animate-pulse rounded-2xl bg-white/70 dark:bg-[#14291f]" /></div>
      ) : lines.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#6B7280] shadow-sm dark:bg-[#14291f] dark:text-[#A9B8AF]">No budget categories yet. Add categories first, then set limits here.</div>
      ) : (
        <>
          <div className="rounded-2xl border border-[#EFEAD8] bg-white p-4 shadow-sm dark:border-[#243b30] dark:bg-[#14291f]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#6B7280] dark:text-[#A9B8AF]">Total budgeted</span>
              <span className="text-lg font-semibold tabular-nums text-[#0B3D2E] dark:text-white">{formatMoney(total.available)}</span>
            </div>
            <div className="mt-3"><BudgetBar pct={total.pct} height={10} /></div>
            <p className="mt-2 text-xs text-[#6B7280] dark:text-[#A9B8AF]">{formatMoney(total.spent)} spent{total.hasBudget ? ` · ${Math.floor(total.pct)}% used` : ''}</p>
            <button 
              type="button" 
              onClick={() => setPlanOpen(true)} 
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-3 text-sm font-semibold text-[#0B3D2E]"
            >
              <Wand2 size={16} /> Apply Custom Split
            </button>
          </div>
          
          {GROUPS.map((g) => {
            const gl = lines.filter((l) => l.group === g.key)
            if (gl.length === 0) return null
            const spent = gl.reduce((s, l) => s + l.spent, 0)
            const available = gl.reduce((s, l) => s + l.available, 0)
            return (
              <section key={g.key} className="rounded-2xl border border-[#EFEAD8] bg-white p-4 shadow-sm dark:border-[#243b30] dark:bg-[#14291f]">
                <div className="flex items-baseline justify-between"><h2 className="text-sm font-semibold text-[#0B3D2E] dark:text-white">{g.label}</h2><span className="text-xs tabular-nums text-[#6B7280] dark:text-[#A9B8AF]">{formatMoney(spent)} / {formatMoney(available)}</span></div>
                <div className="mt-2"><BudgetBar pct={usedPct(spent, available)} height={6} /></div>
                <div className="mt-1 divide-y divide-[#F1ECDC] dark:divide-[#243b30]">
                  {gl.map((l) => (<CategoryBudgetRow key={l.categoryId} line={l} onLimit={(c) => setLimit(l, c)} onRollover={(on) => setRollover(l, on)} />))}
                </div>
              </section>
            )
          })}
        </>
      )}
      
      <ApplyPlanDialog 
        open={planOpen} 
        onOpenChange={setPlanOpen} 
        monthLabel={monthLabel(month)} 
        lines={lines} 
        saving={save.isPending} 
        onApply={(rows) => saveRows(rows, 'Budget applied', () => setPlanOpen(false))}
        defaultIncome={monthlyIncome}
        defaultSplit={{
          needs: profile?.split_needs_pct ?? 50,
          wants: profile?.split_wants_pct ?? 30,
          savings: profile?.split_savings_pct ?? 20,
        }}
        pinRequired={pinOn}
      />
    </div>
  )
}