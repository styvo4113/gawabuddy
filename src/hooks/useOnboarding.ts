import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { toPayload } from '@/lib/onboarding'

type Payload = ReturnType<typeof toPayload>

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Payload) => {
      // 1. Run the SQL function to create profile and accounts
      const { error } = await supabase.rpc('complete_onboarding', {
        p_income: p.income,
        p_template: p.template,
        p_needs: p.needs,
        p_wants: p.wants,
        p_savings: p.savings,
        p_accounts: p.accounts,
      })
      if (error) throw error

      // 2. Manually create the opening balance transaction as a backup
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate total balance from the accounts draft
      const totalBalance = p.accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0)

      if (totalBalance > 0) {
        // Find the first account ID created by the SQL function
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (accounts && accounts.length > 0) {
          // Find an income category
          let { data: categories } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'income')
            .limit(1)

          // If no income category exists, create one
          let categoryId = categories?.[0]?.id
          if (!categoryId) {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({ user_id: user.id, name: 'Salary', type: 'income', icon: 'Wallet', color: '#1E8E3E' })
              .select('id')
              .single()
            categoryId = newCat?.id
          }

          // Insert the transaction
          await supabase.from('transactions').insert({
            user_id: user.id,
            account_id: accounts[0].id,
            category_id: categoryId,
            type: 'income',
            amount: totalBalance, // Using 'amount' as we discovered
            date: new Date().toISOString().split('T')[0],
            note: 'Opening Balance',
          })
        }
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