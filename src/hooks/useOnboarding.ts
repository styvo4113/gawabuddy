import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { toPayload } from '@/lib/onboarding'

type Payload = ReturnType<typeof toPayload>

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async (p: Payload) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")

      // 1. Update Profile
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

      // 2. Create Accounts
      let firstAccountId = null
      let totalBalance = 0

      for (const acc of p.accounts) {
        // Force safe conversion to number, defaulting to 0
        const safeBalance = Number(acc.balance) || 0
        totalBalance += safeBalance

        const { data: newAcc, error: accError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: acc.name || 'Account',
            type: acc.type || 'cash',
            opening_balance: safeBalance,
          })
          .select('id')
          .single()

        if (accError) throw new Error(`Account error: ${accError.message}`)
        if (!firstAccountId) firstAccountId = newAcc.id
      }

      // 3. Create Opening Balance Transaction
      if (totalBalance > 0 && firstAccountId) {
        // Find or create income category
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

        // Insert Transaction
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: firstAccountId,
            category_id: categoryId,
            type: 'income',
            amount: totalBalance,
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