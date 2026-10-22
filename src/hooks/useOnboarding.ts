import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { toPayload } from '@/lib/onboarding'

type Payload = ReturnType<typeof toPayload>

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Payload) => {
      const { error } = await supabase.rpc('complete_onboarding', {
        p_income: p.income,
        p_template: p.template,
        p_needs: p.needs,
        p_wants: p.wants,
        p_savings: p.savings,
        p_accounts: p.accounts,
      })
      if (error) {
        window.alert(`DATABASE ERROR: ${error.message}`)
        throw error
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