import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Transaction, TxType } from '@/lib/types'

export type TxFilters = { search: string; type: TxType | 'all'; categoryId: string; accountId: string; from: string; to: string }
export const EMPTY_FILTERS: TxFilters = { search: '', type: 'all', categoryId: '', accountId: '', from: '', to: '' }
export const countFilters = (f: TxFilters) => [f.type !== 'all', f.categoryId, f.accountId, f.from, f.to].filter(Boolean).length

const PAGE = 40
const normalize = (t: Transaction): Transaction => ({ ...t, amount_cents: Number(t.amount_cents) })

export function useTransactions(filters: TxFilters) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'list', filters],
    initialPageParam: 0,
    getNextPageParam: (last: Transaction[], all) => (last.length === PAGE ? all.length * PAGE : undefined),
    queryFn: async ({ pageParam }): Promise<Transaction[]> => {
      let q = supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).range(pageParam, pageParam + PAGE - 1)
      if (filters.type !== 'all') q = q.eq('type', filters.type)
      if (filters.categoryId) q = q.eq('category_id', filters.categoryId)
      if (filters.accountId) q = q.or(`account_id.eq.${filters.accountId},transfer_to_account_id.eq.${filters.accountId}`)
      if (filters.from) q = q.gte('date', filters.from)
      if (filters.to) q = q.lte('date', filters.to)
      const s = filters.search.trim().toLowerCase().replace(/[\\%_]/g, '\\$&')
      if (s) q = q.ilike('search_text', `%${s}%`)
      const { data, error } = await q
      if (error) throw error
      return ((data ?? []) as Transaction[]).map(normalize)
    },
  })
}

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(limit)
      if (error) throw error
      return ((data ?? []) as Transaction[]).map(normalize)
    },
  })
}

export type SaveTxInput = { id?: string; account_id: string; category_id: string | null; type: TxType; amount_cents: number; date: string; note: string | null; merchant: string | null; transfer_to_account_id: string | null }

export function useSaveTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...row }: SaveTxInput) => {
      if (id) {
        const { error } = await supabase.from('transactions').update(row).eq('id', id)
        if (error) throw error
        return
      }
      const { error } = await supabase.from('transactions').insert(row)
      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate EVERYTHING so the Dashboard, Chart, and Transactions update instantly
      qc.invalidateQueries()
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}

export async function mpesaCodeExists(code: string): Promise<boolean> {
  const { data, error } = await supabase.from('transactions').select('id').ilike('note', `%${code}%`).limit(1)
  if (error) return false
  return (data?.length ?? 0) > 0
}