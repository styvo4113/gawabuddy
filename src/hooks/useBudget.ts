import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCategories } from '@/hooks/useCategories'
import { GROUPS, GroupKey, Level, levelFor, monthsBetween, shiftMonth, usedPct } from '@/lib/budgetMath'
type BudgetRow = { category_id: string; month: string; limit_cents: number; rollover: boolean }
type SpentRow = { category_id: string; month: string; spent_cents: number }
type CategoryLike = { id: string; name: string; budget_group: GroupKey | null }
export type BudgetLine = { categoryId: string; name: string; group: GroupKey; limit: number; rollover: boolean; carryIn: number; spent: number; available: number; hasRow: boolean }
function useBudgetRaw(month: string) {
  return useQuery({
    queryKey: ['budget', month], staleTime: 0, refetchOnMount: 'always',
    queryFn: async () => {
      const { data: budgets, error } = await supabase.from('budgets').select('category_id, month, limit_cents, rollover').lte('month', month)
      if (error) throw error
      const rows = (budgets ?? []) as BudgetRow[]
      const earliest = rows.length ? rows.reduce((a, b) => (a.month < b.month ? a : b)).month : month
      const { data: spent, error: e2 } = await supabase.rpc('monthly_spent', { p_from: earliest, p_to: shiftMonth(month, 1) })
      if (e2) throw e2
      return { budgets: rows, spent: (spent ?? []) as SpentRow[], earliest }
    },
  })
}
export function useBudget(month: string) {
  const cats = useCategories()
  const raw = useBudgetRaw(month)
  const lines = useMemo<BudgetLine[]>(() => {
    if (!cats.data || !raw.data) return []
    const { budgets, spent, earliest } = raw.data
    const groupKeys = new Set<string>(GROUPS.map((g) => g.key))
    const bMap = new Map(budgets.map((b) => [`${b.category_id}|${b.month}`, b]))
    const sMap = new Map(spent.map((s) => [`${s.category_id}|${s.month}`, Number(s.spent_cents)]))
    const months = monthsBetween(earliest, month)
    return (cats.data as CategoryLike[]).filter((c) => c.budget_group && groupKeys.has(c.budget_group)).map((c) => {
      let limit = 0; let rollover = false; let carry = 0; let out!: BudgetLine
      for (const m of months) {
        const row = bMap.get(`${c.id}|${m}`)
        if (row) { limit = Number(row.limit_cents); rollover = row.rollover }
        const carryIn = carry
        const spentM = sMap.get(`${c.id}|${m}`) ?? 0
        const available = limit + carryIn
        carry = rollover ? Math.max(0, available - spentM) : 0
        if (m === month) { out = { categoryId: c.id, name: c.name, group: c.budget_group as GroupKey, limit, rollover, carryIn, spent: spentM, available, hasRow: !!row } }
      }
      return out
    })
  }, [cats.data, raw.data, month])
  return { lines, isLoading: cats.isLoading || raw.isLoading, error: raw.error }
}
export function summarize(lines: BudgetLine[]) {
  const budgeted = lines.filter((l) => l.available > 0)
  const spent = budgeted.reduce((s, l) => s + l.spent, 0)
  const available = budgeted.reduce((s, l) => s + l.available, 0)
  const pct = usedPct(spent, available)
  return { spent, available, pct, level: levelFor(pct), hasBudget: budgeted.length > 0 }
}
export type BudgetSave = { category_id: string; limit_cents: number; rollover: boolean }
export function useSaveBudgets(month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: BudgetSave[]) => {
      const { error } = await supabase.from('budgets').upsert(rows.map((r) => ({ ...r, month })), { onConflict: 'user_id,category_id,month' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget'] }),
  })
}