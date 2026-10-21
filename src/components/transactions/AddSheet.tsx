import { useEffect, useState } from 'react'
import { MessageSquareText, PiggyBank } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSaveTransaction } from '@/hooks/useTransactions'
import { applyKey, centsToInput, displayAmount } from '@/lib/amountInput'
import { formatDay, todayKey } from '@/lib/dates'
import { currencyCode, formatMoney, toCents } from '@/lib/money'
import type { MpesaParse } from '@/lib/mpesa'
import type { Transaction, TxType } from '@/lib/types'
import { Keypad } from './Keypad'
import { MpesaPanel } from './MpesaPanel'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: TxType
  editing?: Transaction | null
}

const TYPES: { key: TxType; label: string }[] = [
  { key: 'expense', label: 'Expense' },
  { key: 'income', label: 'Income' },
  { key: 'transfer', label: 'Transfer' },
]

export function AddSheet({ open, onOpenChange, defaultType, editing }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[94vh] overflow-y-auto rounded-t-3xl bg-[#F8F5EC] px-6 pt-4">
        <SheetHeader className="p-0">
          <SheetTitle className="text-base text-[#0B3D2E]">
            {editing ? 'Edit transaction' : 'New transaction'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Enter an amount, choose a category and account, then save.
          </SheetDescription>
        </SheetHeader>
        {open && (
          <QuickAdd
            defaultType={defaultType}
            editing={editing ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

const chip = (active: boolean) =>
  `flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium ${
    active ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white' : 'border-[#CFC8B0] bg-white text-[#374151]'
  }`

const FIELD =
  'mt-1 w-full rounded-lg border border-[#CFC8B0] bg-white px-3 py-2 text-base text-[#1F2937] outline-none focus:border-[#D4A017]'

function QuickAdd({
  defaultType,
  editing,
  onDone,
}: {
  defaultType?: TxType
  editing: Transaction | null
  onDone: () => void
}) {
  const accountsQuery = useAccounts()
  const categories = useCategories().data ?? []
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const save = useSaveTransaction()
  const queryClient = useQueryClient()
  
  const accounts = accountsQuery.data ?? []

  const [type, setType] = useState<TxType>(editing?.type ?? defaultType ?? 'expense')
  const [amount, setAmount] = useState(editing ? centsToInput(editing.amount_cents) : '')
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '')
  const [accountId, setAccountId] = useState(editing?.account_id ?? '')
  const [toAccountId, setToAccountId] = useState(editing?.transfer_to_account_id ?? '')
  const [date, setDate] = useState(editing?.date ?? todayKey())
  const [merchant, setMerchant] = useState(editing?.merchant ?? '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [showDate, setShowDate] = useState(false)
  const [showDetails, setShowDetails] = useState(!!(editing?.merchant || editing?.note))
  const [showMpesa, setShowMpesa] = useState(false)
  const [banner, setBanner] = useState<{ fee: number | null; duplicate: boolean } | null>(null)

  // Smart Savings State
  const [autoSave, setAutoSave] = useState(profile?.auto_save_enabled ?? false)
  const [autoSavePct, setAutoSavePct] = useState(profile?.auto_save_percentage ?? 20)

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id)
    }
  }, [accounts, accountId])

  const account = accountId || accounts[0]?.id || ''

  const options = categories.filter((c) =>
    type === 'income' ? c.budget_group === null : c.budget_group !== null,
  )

  function press(key: string) {
    setAmount((cur) => applyKey(cur, key))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (/^\d$/.test(e.key) || e.key === '.') setAmount((cur) => applyKey(cur, e.key))
      else if (e.key === 'Backspace') setAmount((cur) => applyKey(cur, 'back'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function changeType(next: TxType) {
    setType(next)
    setCategoryId('')
    setToAccountId('')
  }

  function applyMpesa(r: MpesaParse, duplicate: boolean) {
    setType(r.type)
    setAmount(centsToInput(r.amountCents))
    if (r.date) setDate(r.date)
    setMerchant(r.merchant)
    setNote(r.code ? `M-PESA ${r.code}` : '')
    setShowDetails(true)
    const mpesaAccount = accounts.find((a) => a.type === 'mpesa')
    if (mpesaAccount) setAccountId(mpesaAccount.id)
    const hinted = r.categoryHint
      ? categories.find((c) => c.name.toLowerCase() === r.categoryHint!.toLowerCase())
      : undefined
    setCategoryId(hinted?.id ?? '')
    setBanner({ fee: r.feeCents, duplicate })
    setShowMpesa(false)
  }

  async function submit() {
    const cents = toCents(amount)
    if (!cents) return toast.error('Enter an amount.')
    if (!account) return toast.error('No account found. Please set one up in Onboarding.')
    if (type === 'transfer') {
      if (!toAccountId) return toast.error('Choose the account to move the money to.')
      if (toAccountId === account) return toast.error('Pick two different accounts.')
    } else if (!categoryId) {
      return toast.error('Pick a category.')
    }

    save.mutate(
      {
        id: editing?.id,
        account_id: account,
        category_id: type === 'transfer' ? null : categoryId,
        type,
        amount_cents: cents,
        date,
        note: note.trim() || null,
        merchant: merchant.trim() || null,
        transfer_to_account_id: type === 'transfer' ? toAccountId : null,
      },
      {
        onSuccess: async () => {
          // --- SMART SAVINGS LOGIC ---
          if (type === 'income' && autoSave && autoSavePct > 0) {
            // 1. Update the user's permanent preference in the database
            updateProfile.mutate({ auto_save_enabled: true, auto_save_percentage: autoSavePct })

            // 2. Move the money to a savings account
            const savingsAmount = Math.floor((cents * autoSavePct) / 100)
            const savingsAccount = accounts.find(a => a.type === 'savings')
            
            if (savingsAccount && savingsAmount > 0) {
              const { error: transferError } = await supabase.from('transactions').insert({
                account_id: account,
                transfer_to_account_id: savingsAccount.id,
                type: 'transfer',
                amount_cents: savingsAmount,
                date: date,
                note: `Auto-saved ${autoSavePct}% of income`,
                category_id: null,
                merchant: null,
              })

              if (transferError) {
                toast.error('Income saved, but could not auto-save to savings.')
              } else {
                toast.success(`Income saved. Auto-saved ${formatMoney(savingsAmount)} to ${savingsAccount.name}!`)
              }
            }
          } else {
            toast.success(editing ? 'Transaction updated' : `${TYPES.find((t) => t.key === type)?.label} saved`)
          }

          queryClient.invalidateQueries()
          onDone()
        },
        onError: (e) =>
          toast.error((e as { message?: string }).message || 'Could not save. Try again.'),
      },
    )
  }

  if (accountsQuery.isLoading) {
    return <div className="p-8 text-center text-sm text-[#6B7280]">Loading accounts…</div>
  }

  return (
    <div className="space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-full bg-[#E9E4D4] p-1" role="group" aria-label="Transaction type">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={type === t.key}
              onClick={() => changeType(t.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                type === t.key ? 'bg-[#0B3D2E] text-white' : 'text-[#374151]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowMpesa((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-[#CFC8B0] bg-white px-3 py-2 text-xs font-semibold text-[#0B3D2E]"
        >
          <MessageSquareText size={14} aria-hidden="true" /> M-Pesa
        </button>
      </div>

      {showMpesa && <MpesaPanel onApply={applyMpesa} onClose={() => setShowMpesa(false)} />}

      {banner && (
        <div role="status" className="space-y-1 rounded-xl bg-[#0B3D2E]/10 p-3 text-xs text-[#0B3D2E]">
          <p className="font-semibold">Filled from your M-Pesa message. Check it, pick a category, then save.</p>
          {banner.fee ? <p>Transaction cost of {formatMoney(banner.fee)} is not included. Add it separately if you want it tracked.</p> : null}
          {banner.duplicate && (
            <p className="font-semibold text-[#C0392B]">You may have already saved this message.</p>
          )}
        </div>
      )}

      <div className="text-center">
        <p className="text-xs font-medium text-[#6B7280]">{currencyCode()}</p>
        <p aria-live="polite" className="text-5xl font-bold tabular-nums text-[#0B3D2E]">
          {displayAmount(amount)}
        </p>
      </div>

      {type === 'transfer' ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#6B7280]">From</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {accounts.map((a) => (
                <button key={a.id} type="button" aria-pressed={account === a.id} onClick={() => setAccountId(a.id)} className={chip(account === a.id)}>
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280]">To</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {accounts
                .filter((a) => a.id !== account)
                .map((a) => (
                  <button key={a.id} type="button" aria-pressed={toAccountId === a.id} onClick={() => setToAccountId(a.id)} className={chip(toAccountId === a.id)}>
                    {a.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-semibold text-[#6B7280]">Category</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {options.map((c) => (
                <button key={c.id} type="button" aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)} className={chip(categoryId === c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280]">Account</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {accounts.map((a) => (
                <button key={a.id} type="button" aria-pressed={account === a.id} onClick={() => setAccountId(a.id)} className={chip(account === a.id)}>
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setShowDate((v) => !v)} className={chip(showDate)}>
          {date === todayKey() ? 'Today' : formatDay(date)}
        </button>
        <button type="button" onClick={() => setShowDetails((v) => !v)} className={chip(showDetails)}>
          {showDetails ? 'Hide details' : 'Add note'}
        </button>
      </div>

      {showDate && (
        <label className="block text-xs font-medium text-[#6B7280]">
          Date
          <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} className={FIELD} />
        </label>
      )}

      {showDetails && (
        <div className="grid gap-3">
          {type !== 'transfer' && (
            <label className="block text-xs font-medium text-[#6B7280]">
              Merchant or person
              <input value={merchant} maxLength={80} onChange={(e) => setMerchant(e.target.value)} className={FIELD} />
            </label>
          )}
          <label className="block text-xs font-medium text-[#6B7280]">
            Note
            <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} className={FIELD} />
          </label>
        </div>
      )}

      {/* SMART SAVINGS TOGGLE */}
      {type === 'income' && !editing && (
        <div className="rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/10 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank size={18} className="text-[#D4A017]" />
              <span className="text-sm font-semibold text-[#0B3D2E]">Auto-save to Savings</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoSave(!autoSave)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                autoSave ? 'bg-[#1E8E3E]' : 'bg-gray-300'
              }`}
            >
              <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${autoSave ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {autoSave && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[#6B7280]">Save</span>
              <input
                type="number"
                min="1"
                max="100"
                value={autoSavePct}
                onChange={(e) => setAutoSavePct(Number(e.target.value))}
                className="w-16 rounded-lg border border-[#CFC8B0] bg-white px-2 py-1 text-center text-sm text-[#1F2937] outline-none focus:border-[#D4A017]"
              />
              <span className="text-xs text-[#6B7280]">% of this income</span>
            </div>
          )}
        </div>
      )}

      <Keypad onKey={press} />

      <button
        type="button"
        disabled={save.isPending}
        onClick={submit}
        className="h-14 w-full rounded-2xl bg-[#0B3D2E] text-base font-bold text-white disabled:opacity-50"
      >
        {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save'}
      </button>
    </div>
  )
}