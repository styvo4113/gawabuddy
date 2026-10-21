import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { shiftMonth, currentMonthKey } from '@/lib/budgetMath'

export function useChartData() {
  const { user } = useAuth()
  const nowKey = currentMonthKey() // e.g., '2026-10-01'
  const startKey = shiftMonth(nowKey, -5) // 6 months ago

  return useQuery({
    queryKey: ['chart-data', startKey],
    enabled: !!user,
    queryFn: async () => {
      // 1. Fetch all transactions for the last 6 months
      const { data, error } = await supabase
        .from('transactions')
        .select('date, amount_cents, type')
        .gte('date', startKey)
      
      if (error) throw error
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const result = new Map<string, { income: number, spending: number }>()
      
      // 2. Initialize the last 6 months with zeros
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const name = months[d.getMonth()]
        result.set(name, { income: 0, spending: 0 })
      }

      // 3. Loop through transactions and add them to the correct month
      for (const tx of data ?? []) {
        // Parse the date string (YYYY-MM-DD) to get the month index
        const [year, month, day] = tx.date.split('-').map(Number)
        const name = months[month - 1] // month is 1-12, index is 0-11
        
        // Skip if the month name is not in our map (should not happen)
        if (!result.has(name)) continue

        const existing = result.get(name)!
        
        // Convert cents to whole KES for the chart (e.g., 10000 cents = 100 KES)
        const amount = Number(tx.amount_cents) / 100
        
        if (tx.type === 'income') existing.income += amount
        else if (tx.type === 'expense') existing.spending += amount
        
        result.set(name, existing)
      }

      // 4. Return as an array for Recharts
      return Array.from(result.entries()).map(([name, vals]) => ({
        name,
        income: vals.income,
        spending: vals.spending,
      }))
    },
  })
}