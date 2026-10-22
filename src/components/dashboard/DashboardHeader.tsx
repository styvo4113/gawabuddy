import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import './DashboardHeader.css'

// Turn "2026-10" into "October 2026"
const formatMonthLabel = (monthKey: string) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const taglines = [
  'Your money, your goals, your progress.',
  'Take control of your financial future.',
  'Every shilling has a purpose.',
  'Your financial life, all in one place.',
  'Small steps. Stronger finances.',
]

interface DashboardHeaderProps {
  selectedMonthKey: string;
  onMonthClick: () => void;
}

export default function DashboardHeader({ selectedMonthKey, onMonthClick }: DashboardHeaderProps) {
  const { data: profile } = useProfile()
  const first = profile?.full_name.trim().split(' ')[0] || 'there'
  
  const [tagline] = useState(() => {
    return taglines[Math.floor(Math.random() * taglines.length)]
  })

  return (
    <header className="dashboard-header">
      <div className="dashboard-welcome">
        <div className="welcome-title">
          <h1>
            Hello, <span>{first}</span>
          </h1>
          <span className="welcome-wave" aria-label="waving hand">
            👋
          </span>
        </div>

        <p className="welcome-tagline" key={tagline}>
          {tagline}
        </p>
      </div>

      <div className="dashboard-actions">
        {/* Date Picker Button */}
        <button className="month-selector" type="button" onClick={onMonthClick}>
          <span>{formatMonthLabel(selectedMonthKey)}</span>
          <ChevronDown size={16} className="opacity-70" />
        </button>

        {/* Add Button - Wrapped in a Tailwind div to hide on mobile */}
        <div className="hidden md:flex">
          <button 
            className="add-button" 
            type="button"
            onClick={() => {
              const fab = document.querySelector('[aria-label="Add"]') as HTMLButtonElement;
              if (fab) fab.click();
            }}
          >
            <Plus size={18} strokeWidth={3} />
            Add
          </button>
        </div>
      </div>
    </header>
  )
}