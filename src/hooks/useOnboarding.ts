import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { toPayload } from '@/lib/onboarding'

type Payload = ReturnType<typeof toPayload>

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async (p: Payload) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("Not logged in")

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarded: true,
          monthly_income: p.income,
          budget_template: p.template,
          split_needs_pct: p.needs,
          split_wants_pct: p.wants,
          split_savings_pct: p.savings,
        })
        .eq('user_id', user.id)

      if (profileError) throw new Error(`Profile error: ${profileError.message}`)

      let firstAccountId = null
      let totalBalance = 0

      for (const acc of p.accounts) {
        const safeBalance = Number(acc.opening_balance) || 0
        totalBalance += safeBalance

        const safeType = (acc.type || 'cash').toLowerCase()

        const { data: newAcc, error: accError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: acc.name || 'Account',
            type: safeType, 
            opening_balance: safeBalance,
          })
          .select('id')
          .single()

        if (accError) throw new Error(`Account error: ${accError.message}`)
        if (!firstAccountId) firstAccountId = newAcc.id
      }

      if (totalBalance > 0 && firstAccountId) {
        let { data: categories } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .limit(1)

        let categoryId = categories?.[0]?.id
        if (!categoryId) {
          const { data: newCat, error: catError } = await supabase
            .from('categories')
            .insert({ user_id: user.id, name: 'Salary', type: 'income', icon: 'Wallet', color: '#1E8E3E' })
            .select('id')
            .single()
          if (catError) throw new Error(`Category error: ${catError.message}`)
          categoryId = newCat.id
        }

        // THE FINAL FIX: Using 'amount_cents' instead of 'amount'
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: firstAccountId,
            category_id: categoryId,
            type: 'income',
            amount_cents: totalBalance * 100, // Convert 1000 to 100000 cents
            date: new Date().toISOString().split('T')[0],
            note: 'Opening Balance',
          })

        if (txError) throw new Error(`Transaction error: ${txError.message}`)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['profile'] }),
        qc.invalidateQueries({ queryKey: ['accounts'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
        qc.invalidateQueries({ queryKey: ['transactions'] }),
      ])
    },
  })
}