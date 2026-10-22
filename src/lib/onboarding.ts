import { toCents } from '@/lib/money'
import type { AccountType } from '@/lib/types'

export type Template = '50_30_20' | 'custom'
export type DraftAccount = { key: string; name: string; type: AccountType; opening: string }
export type Draft = { income: string; template: Template; needs: string; wants: string; savings: string; accounts: DraftAccount[] }

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'MPesa' }, { value: 'bank', label: 'Bank' }, { value: 'savings', label: 'Savings' },
]

export const newKey = () => crypto.randomUUID()

export const newDraft = (): Draft => ({
  income: '', template: '50_30_20', needs: '50', wants: '30', savings: '20',
  accounts: [ 
    { key: newKey(), name: 'Cash', type: 'cash', opening: '' }, 
    { key: newKey(), name: 'MPesa', type: 'mpesa', opening: '' }, 
    { key: newKey(), name: 'Bank', type: 'bank', opening: '' } 
  ],
})

const pct = (s: string) => (/^\d{1,3}$/.test(s.trim()) ? Number(s) : NaN)

export function validate(step: number, d: Draft): string | null {
  if (step === 0 && !toCents(d.income)) return 'Enter your monthly income, above zero.'
  if (step === 1 && d.template === 'custom') {
    const parts = [pct(d.needs), pct(d.wants), pct(d.savings)]
    if (parts.some(Number.isNaN)) return 'Enter whole numbers for each percentage.'
    const total = parts[0] + parts[1] + parts[2]
    if (total !== 100) return `Your percentages add up to ${total}. They must add up to 100.`
  }
  if (step === 2) {
    if (d.accounts.length === 0) return 'Add at least one account.'
    const names = d.accounts.map((a) => a.name.trim().toLowerCase())
    if (names.some((n) => !n)) return 'Give every account a name.'
    if (new Set(names).size !== names.length) return 'Each account needs a different name.'
    // Use Number() for validation instead of toCents
    if (d.accounts.some((a) => a.opening.trim() !== '' && isNaN(Number(a.opening)))) return 'Opening balances must be valid amounts.'
  }
  return null
}

export function toPayload(d: Draft) {
  const preset = d.template === '50_30_20'
  return {
    income: toCents(d.income) ?? 0, 
    template: d.template, 
    needs: preset ? 50 : Number(d.needs), 
    wants: preset ? 30 : Number(d.wants), 
    savings: preset ? 20 : Number(d.savings),
    accounts: d.accounts.map((a) => ({ 
      name: a.name.trim(), 
      type: a.type, 
      // FIXED: Use Number() to store the exact amount (e.g. 1000), not toCents (which makes it 100000)
      opening_balance: Number(a.opening) || 0 
    })),
  }
}