import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Minus, Target, Wallet, PieChart, TrendingUp, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useProfile } from '@/hooks/useProfile'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useMonthTotals } from '@/hooks/useDashboard'
import { useChartData } from '@/hooks/useChartData'
import { useSavingsGoals } from '@/hooks/useSavings'
import { useBudget, summarize } from '@/hooks/useBudget'
import { currentMonthKey, monthBounds } from '@/lib/budgetMath'
import { formatMoney } from '@/lib/money'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { SpendingDonut } from '@/components/dashboard/SpendingDonut'
import { QuoteCard } from '@/components/dashboard/QuoteCard'
import { GrowYourSavings } from '@/components/dashboard/GrowYourSavings'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

// ─────────────────────────────────────────────────────────────
// Savings commitment config
// ─────────────────────────────────────────────────────────────
const SAVINGS_RATE = 0.10 // 10%

export default function Dashboard() {
  const { data: profile } = useProfile()
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey())
  const { from, to } = monthBounds(selectedMonthKey)
  
  const accounts = useAccounts().data ?? []
  const categories = useCategories().data ?? []
  const recentTxs = useTransactions({ search: '', type: 'all', categoryId: '', accountId: '', from, to }).data?.pages[0]?.slice(0, 5) ?? []

  const { data: totals } = useMonthTotals(from, to)
  const { data: realChartData, isLoading: chartLoading } = useChartData()
  const { data: goals } = useSavingsGoals()
  const { lines: budgetLines } = useBudget(selectedMonthKey)
  const chartData = realChartData && realChartData.length > 0 ? realChartData : []

  const totalSavings = goals?.reduce((sum, g) => sum + g.saved_cents, 0) ?? 0
  const emergencyGoal = goals?.find(g => g.type === 'emergency')
  const budgetTotal = summarize(budgetLines)

  const accountName = new Map(accounts.map((a) => [a.id, a.name]))
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const bgMain = "bg-[#F8F5EC] dark:bg-[#031310]"
  const cardBg = "bg-white border border-[#EFEAD8] dark:bg-[#061F1B] dark:border-[#163C35]"
  const textMuted = "text-[#6B7280] dark:text-[#9FB5B0]"
  const textMain = "text-[#1F2937] dark:text-[#F5F8F7]"
  const brightGreen = "text-[#1E8E3E] dark:text-[#4ADE80]"

  // ───────────────────────────────────────────────────────────
  // CORE MONEY MATH — savings is reserved BEFORE spending
  // ───────────────────────────────────────────────────────────
  const incomeVal = totals?.income ?? 0
  const spentVal = totals?.spent ?? 0
  const reservedForSavings = Math.round(incomeVal * SAVINGS_RATE)
  const safeToSpend = incomeVal - reservedForSavings
  const remainingVal = safeToSpend - spentVal

  const isOverspending = remainingVal < 0
  const overspendAmount = Math.abs(remainingVal)

  const isOverBudget = budgetTotal.hasBudget && budgetTotal.pct > 100
  const overspentAmount = budgetTotal.spent - budgetTotal.available

  const topCards = [
    { label: 'Total Income', val: incomeVal, icon: Wallet, color: 'text-[#1E8E3E] dark:text-[#4ADE80]', bg: 'bg-[#1E8E3E]/10 dark:bg-[#4ADE80]/10', to: '/transactions' },
    { label: 'Total Spent', val: spentVal, icon: PieChart, color: 'text-[#C0392B]', bg: 'bg-[#C0392B]/10', to: '/transactions' },
    { label: 'Monthly Limit', val: safeToSpend, icon: TrendingUp, color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10', to: '/budgets' },
    { label: 'Left to Spend', val: remainingVal, icon: Target, color: 'text-[#A855F7]', bg: 'bg-[#A855F7]/10', to: '/goals' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg border p-3 shadow-lg ${cardBg}`}>
          <p className={`mb-2 text-sm font-bold ${textMain}`}>{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="flex items-center justify-between gap-4 text-xs font-medium" style={{ color: entry.color }}>
              <span>{entry.name}</span>
              <span>{formatMoney(entry.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`min-h-screen ${bgMain} p-4 md:p-8 font-sans`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">

        {/* MAIN COLUMN */}
        <div className="flex-1 space-y-6">

          {/* NEW PREMIUM HEADER COMPONENT */}
          <DashboardHeader 
            selectedMonthKey={selectedMonthKey} 
            onMonthClick={() => {
              // If you build a custom date dropdown, trigger it here
              console.log("Open month selector");
            }} 
          />

          {/* ⚠️ OVERSPEND WARNING BANNER */}
          {isOverspending && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#C0392B]/40 bg-[#C0392B]/10 p-4">
              <AlertTriangle className="mt-0.5 shrink-0 text-[#C0392B]" size={20} />
              <div>
                <p className="text-sm font-bold text-[#C0392B]">
                  You're eating into your savings by {formatMoney(overspendAmount)}.
                </p>
                <p className={`mt-1 text-xs ${textMuted}`}>
                  You committed {formatMoney(reservedForSavings)} ({(SAVINGS_RATE * 100).toFixed(0)}% of income) to savings, which left you {formatMoney(safeToSpend)} safe to spend — but you've spent {formatMoney(spentVal)}.
                </p>
              </div>
            </div>
          )}

          {/* 4 Top Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {topCards.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className={`group rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${c.bg} ${c.color}`}><c.icon size={18} /></div>
                  <ArrowRight size={16} className={`${textMuted} transition-transform group-hover:translate-x-1`} />
                </div>
                <p className={`mt-3 text-xs font-medium ${textMuted}`}>{c.label}</p>
                <p className={`text-lg font-bold ${c.val < 0 ? 'text-[#C0392B]' : textMain}`}>{formatMoney(c.val)}</p>
                <p className={`mt-1 text-xs font-medium ${textMuted}`}>
                  {c.label === 'Monthly Limit'
                    ? `Income minus ${formatMoney(reservedForSavings)} savings`
                    : c.label === 'Left to Spend'
                    ? 'Available right now'
                    : 'This month'}
                </p>
              </Link>
            ))}
          </div>

          {/* Savings commitment strip */}
          <div className={`flex flex-col gap-2 rounded-2xl p-4 shadow-sm md:flex-row md:items-center md:justify-between ${cardBg}`}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#A855F7]/10 p-2 text-[#A855F7]"><Target size={18} /></div>
              <div>
                <p className={`text-xs font-medium ${textMuted}`}>Savings commitment ({(SAVINGS_RATE * 100).toFixed(0)}% of income)</p>
                <p className={`text-sm font-bold ${textMain}`}>{formatMoney(reservedForSavings)} reserved this month</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className={`text-xs font-medium ${textMuted}`}>Total saved across all goals</p>
              <p className={`text-sm font-bold ${brightGreen}`}>{formatMoney(totalSavings)}</p>
            </div>
          </div>

          {/* Monthly Overview Chart */}
          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-bold ${textMain}`}>Monthly Overview</h2>
              <div className="flex gap-4 text-xs">
                <span className={`flex items-center gap-1 ${textMain}`}><span className="h-2 w-2 rounded-full bg-[#1E8E3E] dark:bg-[#4ADE80]" /> Income</span>
                <span className={`flex items-center gap-1 ${textMuted}`}><span className="h-2 w-2 rounded-full bg-[#D4A017]" /> Spending</span>
              </div>
            </div>
            <div className="mt-4 h-56 w-full">
              {chartLoading ? (
                <div className="flex h-full items-center justify-center"><p className={`text-sm ${textMuted}`}>Loading chart data...</p></div>
              ) : chartData.length === 0 || chartData.every((d) => d.income === 0 && d.spending === 0) ? (
                <div className="flex h-full flex-col items-center justify-center"><p className={`text-sm font-semibold ${textMain}`}>No data for the last 6 months</p><p className={`mt-1 text-xs ${textMuted}`}>Add some transactions to see your chart.</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E8E3E" stopOpacity={0.3}/><stop offset="95%" stopColor="#1E8E3E" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A017" stopOpacity={0.3}/><stop offset="95%" stopColor="#D4A017" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEAD8" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                    
                    <YAxis
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const shillings = value / 100;
                        return shillings >= 1000 ? `${Math.round(shillings / 1000)}k` : shillings.toString();
                      }}
                    />
                    
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#1E8E3E" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                    <Area type="monotone" dataKey="spending" name="Spending" stroke="#D4A017" fillOpacity={1} fill="url(#colorSpending)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts Row: Spending Donut + Budget Health */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}><SpendingDonut from={from} to={to} /></div>

            <Link to="/budgets" className={`group rounded-2xl p-5 shadow-sm transition-all hover:scale-[1.01] ${cardBg} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className={`text-sm font-bold ${textMain}`}>Budget Health</h2>
                  {isOverBudget && (
                    <span className="flex items-center gap-1 rounded-full bg-[#C0392B]/10 px-2 py-1 text-xs font-bold text-[#C0392B]"><AlertTriangle size={12} /> Over Budget!</span>
                  )}
                  <ArrowRight size={16} className={`${textMuted} transition-transform group-hover:translate-x-1`} />
                </div>
                <p className={`mt-2 text-xs ${textMuted}`}>{budgetTotal.hasBudget ? `${formatMoney(budgetTotal.spent)} spent of ${formatMoney(budgetTotal.available)} budgeted` : 'No budget set for this month.'}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E9E4D4] dark:bg-[#163C35]">
                  <div className={`h-full rounded-full ${isOverBudget ? 'bg-[#C0392B]' : 'bg-[#1E8E3E] dark:bg-[#4ADE80]'}`} style={{ width: `${Math.min(100, budgetTotal.pct)}%` }} />
                </div>
                {isOverBudget ? (<p className="mt-1 text-right text-xs font-bold text-[#C0392B]">Over by {formatMoney(overspentAmount)}</p>) : (<p className={`mt-1 text-right text-xs font-bold ${brightGreen}`}>{Math.floor(budgetTotal.pct)}%</p>)}
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#E9E4D4] dark:border-[#163C35]"><span className={`text-xs font-bold ${textMuted}`}>{emergencyGoal ? Math.floor((emergencyGoal.saved_cents / emergencyGoal.target_cents) * 100) : 0}%</span></div>
                <div><p className={`text-sm font-bold ${textMain}`}>Emergency Fund</p><p className={`text-xs ${textMuted}`}>{emergencyGoal ? `${formatMoney(emergencyGoal.saved_cents)} of ${formatMoney(emergencyGoal.target_cents)}` : 'No emergency fund set.'}</p></div>
              </div>
            </Link>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full space-y-6 lg:w-80">

          {/* Small steps widget */}
          <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <img src="/mountains.jpg" alt="Mountains" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="relative z-10">
              <p className={`font-bold ${textMain}`}>Small steps.</p><p className="text-xl font-bold text-[#D4A017]">Big goals.</p>
              <p className={`mt-2 text-xs ${textMain}`}>Set your savings goal today and build the future you want.</p>
              <Link to="/goals" className="mt-4 inline-block rounded-xl bg-[#1E8E3E] dark:bg-[#4ADE80] px-4 py-2 text-xs font-bold text-white dark:text-[#031310]">Set a Goal →</Link>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#061F1B] to-transparent z-0" />
          </div>

          {/* Quick Actions */}
          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <h2 className={`text-sm font-bold ${textMain}`}>Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/transactions" className="flex items-center justify-center gap-2 rounded-xl bg-[#1E8E3E]/10 dark:bg-[#4ADE80]/10 py-2.5 text-xs font-bold text-[#1E8E3E] dark:text-[#4ADE80]"><Plus size={14} /> Add Income</Link>
              <Link to="/transactions" className="flex items-center justify-center gap-2 rounded-xl bg-[#C0392B]/10 py-2.5 text-xs font-bold text-[#C0392B]"><Minus size={14} /> Add Expense</Link>
              <Link to="/budgets" className="flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6]/10 py-2.5 text-xs font-bold text-[#3B82F6]"><Wallet size={14} /> Set Budget</Link>
              <Link to="/goals" className="flex items-center justify-center gap-2 rounded-xl bg-[#A855F7]/10 py-2.5 text-xs font-bold text-[#A855F7]"><Target size={14} /> Save Goal</Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between"><h2 className={`text-sm font-bold ${textMain}`}>Recent Transactions</h2><Link to="/transactions" className={`text-xs font-medium ${brightGreen} hover:underline`}>View all</Link></div>
            <ul className="mt-3 divide-y divide-[#F1ECDC] dark:divide-[#163C35]">
              {recentTxs.length === 0 ? (<p className={`py-4 text-center text-xs ${textMuted}`}>No recent transactions.</p>) : (
                recentTxs.map((tx) => (<li key={tx.id}><TransactionRow tx={tx} category={tx.category_id ? categoryById.get(tx.category_id) : undefined} accountName={accountName.get(tx.account_id) ?? 'Account'} toAccountName={tx.transfer_to_account_id ? accountName.get(tx.transfer_to_account_id) : undefined} /></li>))
              )}
            </ul>
          </div>

          {/* Grow Your Savings Component */}
          <GrowYourSavings />

          <QuoteCard />
        </div>
      </div>
    </div>
  )
}