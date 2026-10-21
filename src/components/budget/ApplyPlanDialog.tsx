import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatMoney } from '@/lib/money'
import { GROUPS, buildPlan, parseAmountToCents, GroupKey } from '@/lib/budgetMath'
import { verifyPin } from '@/lib/pin'
import type { BudgetLine, BudgetSave } from '@/hooks/useBudget'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  monthLabel: string
  lines: BudgetLine[]
  saving: boolean
  onApply: (rows: BudgetSave[]) => void
  defaultIncome: number
  defaultSplit: Record<GroupKey, number>
  pinRequired: boolean
}

export function ApplyPlanDialog({ 
  open, 
  onOpenChange, 
  monthLabel, 
  lines, 
  saving, 
  onApply, 
  defaultIncome, 
  defaultSplit, 
  pinRequired 
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-white text-[#1F2937] dark:bg-[#14291f] dark:text-white dark:border-[#243b30]">
        <DialogHeader>
          <DialogTitle>Apply Budget Plan</DialogTitle>
          <DialogDescription className="dark:text-[#A9B8AF]">
            This will set your category limits for {monthLabel} based on your income and custom split.
          </DialogDescription>
        </DialogHeader>
        <PlanPreview 
          lines={lines} 
          saving={saving} 
          onApply={onApply} 
          onCancel={() => onOpenChange(false)} 
          defaultIncome={defaultIncome}
          defaultSplit={defaultSplit}
          pinRequired={pinRequired}
        />
      </DialogContent>
    </Dialog>
  )
}

function PlanPreview({ 
  lines, 
  saving, 
  onApply, 
  onCancel, 
  defaultIncome, 
  defaultSplit,
  pinRequired
}: { 
  lines: BudgetLine[]; 
  saving: boolean; 
  onApply: (rows: BudgetSave[]) => void; 
  onCancel: () => void;
  defaultIncome: number;
  defaultSplit: Record<GroupKey, number>;
  pinRequired: boolean;
}) {
  const [income, setIncome] = useState(defaultIncome > 0 ? String(defaultIncome / 100) : '')
  const incomeCents = parseAmountToCents(income) ?? 0
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')

  const byId = useMemo(() => new Map(lines.map((l) => [l.categoryId, l])), [lines])
  
  const plan = useMemo(() => {
    return buildPlan(incomeCents, lines.map((l) => ({ id: l.categoryId, group: l.group })), defaultSplit)
  }, [incomeCents, lines, defaultSplit])

  const canSave = incomeCents > 0 && plan.lines.length > 0 && (!pinRequired || (showPin && pin.length >= 4))

  async function handleApply() {
    if (pinRequired && !showPin) {
      setShowPin(true)
      return
    }

    if (pinRequired && showPin) {
      const ok = await verifyPin(pin)
      if (!ok) {
        setPin('')
        return
      }
    }

    onApply(plan.lines.map((l) => ({
      category_id: l.categoryId,
      limit_cents: l.cents,
      rollover: byId.get(l.categoryId)?.rollover ?? false,
    })))
  }

  return (
    <div className="space-y-4">
      <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A9B8AF]">
        Monthly income (KES)
        <input
          inputMode="decimal"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="e.g. 60000"
          className="mt-1 w-full rounded-lg border border-[#CFC8B0] bg-white px-3 py-2 text-base text-[#1F2937] outline-none focus:border-[#D4A017] dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white"
        />
      </label>

      {incomeCents > 0 && (
        <div className="rounded-lg bg-[#F8F5EC] p-3 text-sm text-[#374151] dark:bg-[#0c1b16] dark:text-[#dad5c3]">
          <p className="font-semibold text-[#0B3D2E] dark:text-white">Your Split:</p>
          <p>Needs: {defaultSplit.needs}% · Wants: {defaultSplit.wants}% · Savings: {defaultSplit.savings}% · Tithe: {defaultSplit.tithe}% · Emergency: {defaultSplit.emergency}%</p>
        </div>
      )}

      {incomeCents > 0 && GROUPS.map((g) => {
        const members = plan.lines.filter((l) => l.group === g.key)
        if (members.length === 0) return null
        return (
          <div key={g.key} className="rounded-xl bg-[#F8F5EC] p-3 dark:bg-[#0c1b16]">
            <div className="flex items-center justify-between text-sm font-semibold text-[#0B3D2E] dark:text-white">
              <span>{g.label}</span>
              <span className="tabular-nums">{formatMoney(plan.groupTotals[g.key] ?? 0)}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {members.map((l) => {
                const cur = byId.get(l.categoryId)
                return (
                  <li key={l.categoryId} className="flex items-center justify-between text-xs text-[#374151] dark:text-[#dad5c3]">
                    <span className="truncate pr-2">{cur?.name}</span>
                    <span className="shrink-0 tabular-nums">{formatMoney(l.cents)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}

      {showPin && (
        <div className="space-y-2 rounded-lg bg-[#F1ECDC] p-3 dark:bg-[#243b30]">
          <p className="text-xs font-medium text-[#0B3D2E] dark:text-white">Enter your PIN to confirm this change:</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            className="w-full rounded-lg border border-[#CFC8B0] bg-white px-3 py-2 text-center text-lg tracking-widest dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#CFC8B0] py-3 text-sm font-semibold text-[#374151] dark:border-[#243b30] dark:text-white">
          Cancel
        </button>
        <button 
          type="button" 
          disabled={saving || (!showPin && !canSave)} 
          onClick={handleApply} 
          className="flex-1 rounded-xl bg-[#0B3D2E] py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-[#4ADE80] dark:text-[#031310]"
        >
          {saving ? 'Applying…' : showPin ? 'Confirm with PIN' : 'Apply'}
        </button>
      </div>
    </div>
  )
}