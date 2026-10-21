export type GroupKey = 'needs' | 'wants' | 'savings' | 'debt' | 'tithe' | 'emergency'

export const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'needs', label: 'Needs' },
  { key: 'wants', label: 'Wants' },
  { key: 'savings', label: 'Savings' },
  { key: 'debt', label: 'Debt' },
  { key: 'tithe', label: 'Tithe' },
  { key: 'emergency', label: 'Emergency' },
]

export const PLAN_SPLIT: Record<GroupKey, number> = {
  needs: 50,
  wants: 30,
  savings: 10,
  debt: 0,
  tithe: 10,
  emergency: 0,
}

export type Level = 'ok' | 'warn' | 'over'

export const LEVEL_COLOR: Record<Level, string> = {
  ok: '#1E8E3E',
  warn: '#F59E0B',
  over: '#C0392B',
}

let startDay = 1
export const setMonthStartDay = (n: number) => { 
  startDay = Math.min(28, Math.max(1, Math.round(n) || 1)) 
}
export const getMonthStartDay = () => startDay

const monthKey = (d: Date) => 
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

export const currentMonthKey = (now = new Date()) => {
  return monthKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (startDay - 1)))
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-KE', {
    month: 'long',
    year: 'numeric',
  })
}

export function monthsBetween(from: string, to: string) {
  const out: string[] = []
  let k = from
  while (k <= to) {
    out.push(k)
    k = shiftMonth(k, 1)
  }
  return out
}

export function usedPct(spent: number, available: number) {
  if (available <= 0) return spent > 0 ? 100 : 0
  return (spent / available) * 100
}

export function levelFor(pct: number): Level {
  if (pct >= 100) return 'over'
  if (pct >= 80) return 'warn'
  return 'ok'
}

export function parseAmountToCents(input: string): number | null {
  const n = Number(input.replace(/[,\s]/g, ''))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

export type PlanLine = { categoryId: string; group: GroupKey; cents: number }

export function buildPlan(
  incomeCents: number,
  cats: { id: string; group: GroupKey }[],
) {
  const lines: PlanLine[] = []
  const groupTotals: Record<GroupKey, number> = {
    needs: 0,
    wants: 0,
    savings: 0,
    debt: 0,
    tithe: 0,
    emergency: 0,
  }
  let allocated = 0

  for (const g of GROUPS) {
    const members = cats.filter((c) => c.group === g.key)
    if (members.length === 0) continue
    const groupCents = Math.floor((incomeCents * PLAN_SPLIT[g.key]) / 100)
    const units = Math.floor(groupCents / 100)
    const baseUnits = Math.floor(units / members.length)
    const remUnits = units - baseUnits * members.length
    members.forEach((c, i) => {
      lines.push({
        categoryId: c.id,
        group: g.key,
        cents: (baseUnits + (i < remUnits ? 1 : 0)) * 100,
      })
    })
    groupTotals[g.key] = units * 100
    allocated += units * 100
  }

  return { lines, groupTotals, unallocated: incomeCents - allocated }
}