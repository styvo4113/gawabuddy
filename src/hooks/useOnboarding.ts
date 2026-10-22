import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { toPayload } from '@/lib/onboarding'

type Payload = ReturnType<typeof toPayload>

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async (p: Payload) => {
      window.alert("1. STARTING ONBOARDING");

      // 1. Get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("Not logged in")

      // 2. Update Profile
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

      if (profileError) {
        window.alert(`PROFILE ERROR: ${profileError.message}`);
        throw new Error(`Profile error: ${profileError.message}`)
      }

      // 3. Create Accounts
      let firstAccountId = null
      let totalBalance = 0

      for (const acc of p.accounts) {
        const safeBalance = Number(acc.balance) || 0
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

        if (accError) {
          window.alert(`ACCOUNT ERROR: ${accError.message}`);
          throw new Error(`Account error: ${accError.message}`)
        }
        if (!firstAccountId) firstAccountId = newAcc.id
      }

      window.alert(`2. ACCOUNTS SAVED. TOTAL: ${totalBalance}`);

      // 4. Create Opening Balance Transaction
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
          
          if (catError) {
            window.alert(`CATEGORY ERROR: ${catError.message}`);
            throw new Error(`Category error: ${catError.message}`)
          }
          categoryId = newCat.id
        }

        window.alert(`3. TRYING TO SAVE TRANSACTION...`);

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

        if (txError) {
          window.alert(`TRANSACTION ERROR: ${txError.message}`);
          throw new Error(`Transaction error: ${txError.message}`)
        }
        
        window.alert("4. TRANSACTION SAVED SUCCESSFULLY!");
      } else {
        window.alert("4. SKIPPED TRANSACTION - NO BALANCE ENTERED");
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