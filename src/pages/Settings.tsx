import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, User } from 'lucide-react'
import { toast } from 'sonner'
import { CURRENCIES, type CurrencyCode } from '@/lib/money'
import { usePinEnabled } from '@/lib/pin'
import { setTheme, useIsDark } from '@/lib/theme'
import { DEFAULT_SETTINGS, useSaveSettings, useSettings } from '@/hooks/useSettings'
import { PinSheet, type PinMode } from '@/components/security/PinSheet'
import { DataSection } from '@/components/settings/DataSection'
import { InstallRow } from '@/components/pwa/InstallRow'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'

const ordinal = (n: number) => { 
  const s = ['th', 'st', 'nd', 'rd']; 
  const v = n % 100; 
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}` 
}

const SELECT = 'rounded-lg border border-[#CFC8B0] bg-white px-3 py-2 text-sm text-[#1F2937] outline-none focus:border-[#D4A017] dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 ${
        checked ? 'bg-[#4ADE80]' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#EFEAD8] bg-white p-4 shadow-sm dark:border-[#243b30] dark:bg-[#14291f]">
      <h2 className="text-sm font-semibold text-[#0B3D2E] dark:text-white">{title}</h2>
      <div className="mt-1 divide-y divide-[#F1ECDC] dark:divide-[#243b30]">{children}</div>
    </section>
  )
}

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1F2937] dark:text-white">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-[#6B7280] dark:text-[#A9B8AF]">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function LinkRow({ to, title, hint }: { to: string; title: string; hint: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1F2937] dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs text-[#6B7280] dark:text-[#A9B8AF]">{hint}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-[#9CA3AF]" />
    </Link>
  )
}

export default function Settings() {
  const { data } = useSettings()
  const settings = data ?? DEFAULT_SETTINGS
  const save = useSaveSettings()
  const dark = useIsDark()
  const pinOn = usePinEnabled()
  const [pinMode, setPinMode] = useState<PinMode | null>(null)

  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  function update(patch: Partial<typeof settings>, okMsg: string) {
    save.mutate({ ...settings, ...patch }, { 
      onSuccess: () => toast.success(okMsg), 
      onError: () => toast.error('Could not save that setting. Try again.') 
    })
  }

  const day = settings.month_start_day
  const monthHint = day === 1 
    ? 'Months follow the calendar (1st to the last day).' 
    : `Each month runs from the ${ordinal(day)} to the ${ordinal(day - 1)} of the next month.`

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-28">
      <h1 className="text-base font-semibold text-[#0B3D2E] dark:text-white">Settings</h1>

      <Section title="Account">
        <LinkRow to="/profile" title="Profile" hint="Manage your name, photo and personal details." />
      </Section>

      <Section title="General">
        <Row title="Currency" hint="Changes how amounts are shown. It does not convert them.">
          <select aria-label="Currency" value={settings.currency} disabled={save.isPending} onChange={(e) => update({ currency: e.target.value as CurrencyCode }, 'Currency updated')} className={SELECT}>
            {CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.code} · {c.name}</option>))}
          </select>
        </Row>
        <Row title="Month starts on" hint={monthHint}>
          <select aria-label="Month start day" value={day} disabled={save.isPending} onChange={(e) => update({ month_start_day: Number(e.target.value) }, 'Month start day updated')} className={SELECT}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (<option key={d} value={d}>{ordinal(d)}</option>))}
          </select>
        </Row>
      </Section>

      <Section title="Manage">
        <LinkRow to="/settings/categories" title="Categories" hint="Add, rename or remove spending and income categories." />
        <LinkRow to="/settings/accounts" title="Accounts" hint="Add, rename or remove accounts." />
      </Section>

      <Section title="Smart Savings Split">
        <Row title="Enable auto-split" hint="Automatically move a percentage of every income to your savings account.">
          <Toggle 
            checked={profile?.auto_save_enabled ?? false} 
            onChange={(v) => updateProfile.mutate({ auto_save_enabled: v })} 
          />
        </Row>
        <div className="py-3">
          <p className="text-sm font-medium text-[#1F2937] dark:text-white mb-2">Income Split Percentages</p>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="text-xs text-[#6B7280] dark:text-[#A9B8AF]">Needs</span>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={profile?.split_needs_pct ?? 50} onChange={(e) => updateProfile.mutate({ split_needs_pct: Number(e.target.value) })} className="w-full rounded-lg border border-[#CFC8B0] bg-white px-2 py-1 text-center text-sm dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white" />
                <span className="text-xs text-[#6B7280]">%</span>
              </div>
            </label>
            <label className="flex-1">
              <span className="text-xs text-[#6B7280] dark:text-[#A9B8AF]">Wants</span>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={profile?.split_wants_pct ?? 30} onChange={(e) => updateProfile.mutate({ split_wants_pct: Number(e.target.value) })} className="w-full rounded-lg border border-[#CFC8B0] bg-white px-2 py-1 text-center text-sm dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white" />
                <span className="text-xs text-[#6B7280]">%</span>
              </div>
            </label>
            <label className="flex-1">
              <span className="text-xs text-[#6B7280] dark:text-[#A9B8AF]">Savings</span>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={profile?.split_savings_pct ?? 20} onChange={(e) => updateProfile.mutate({ split_savings_pct: Number(e.target.value) })} className="w-full rounded-lg border border-[#CFC8B0] bg-white px-2 py-1 text-center text-sm dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white" />
                <span className="text-xs text-[#6B7280]">%</span>
              </div>
            </label>
          </div>
        </div>
      </Section>

      <Section title="Appearance">
        <Row title="Dark mode" hint="Follows your phone until you change it here.">
          <Toggle checked={dark} onChange={(v) => setTheme(v ? 'dark' : 'light')} />
        </Row>
      </Section>

      <Section title="Security">
        <Row title="PIN lock" hint="Asks for a PIN when you open the app on this device and after a minute in the background.">
          <Toggle checked={pinOn} onChange={(v) => setPinMode(v ? 'set' : 'disable')} />
        </Row>
        {pinOn && (
          <Row title="Change PIN">
            <button type="button" onClick={() => setPinMode('change')} className="rounded-xl border border-[#CFC8B0] px-3 py-2 text-sm font-semibold text-[#374151] dark:border-[#243b30] dark:text-[#f1ecdc]">Change</button>
          </Row>
        )}
      </Section>

      <Section title="App">
        <InstallRow />
      </Section>

      <DataSection />
      <PinSheet mode={pinMode} onOpenChange={(o) => !o && setPinMode(null)} />
    </div>
  )
}