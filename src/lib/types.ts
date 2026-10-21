import type { CurrencyCode } from '@/lib/money'

export type AccountType = 'cash' | 'mpesa' | 'bank' | 'savings'
export type BudgetGroup = 'needs' | 'wants' | 'savings' | 'debt'

export type Profile = {
  user_id: string
  full_name: string
  currency: CurrencyCode
  month_start_day: number
  onboarded: boolean
  monthly_income: number
  budget_template: '50_30_20' | 'custom'
  needs_pct: number
  wants_pct: number
  savings_pct: number
  auto_save_percentage: number
  auto_save_enabled: boolean
  split_needs_pct: number
  split_wants_pct: number
  split_savings_pct: number
  split_tithe_pct: number
  split_emergency_pct: number
}

export type Account = {
  id: string
  name: string
  type: AccountType
  opening_balance: number
  created_at: string
}

export type Category = {
  id: string
  name: string
  budget_group: BudgetGroup | null
  type: 'income' | 'expense'
  icon: string
  color: string
  sort_order: number
}