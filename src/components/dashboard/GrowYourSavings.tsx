import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function GrowYourSavings() {
  return (
    <Link 
      to="/goals" 
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#1E8E3E]/30 bg-[#061F1B] p-4 shadow-sm transition-all hover:border-[#1E8E3E]/60"
    >
      {/* Custom 3-Leaf SVG */}
      <div className="shrink-0 text-[#4ADE80]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C12 2 15 5 15 9C15 11.5 13.5 13 12 13C10.5 13 9 11.5 9 9C9 5 12 2 12 2Z" />
          <path d="M6 10C6 10 9 11 9 14C9 16 7.5 17 6 17C4.5 17 3 16 3 14C3 11 6 10 6 10Z" />
          <path d="M18 10C18 10 21 11 21 14C21 16 19.5 17 18 17C16.5 17 15 16 15 14C15 11 18 10 18 10Z" />
          <path d="M12 14V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-bold text-white">Grow your savings</p>
        <p className="text-xs text-[#8A9C92]">Automate your savings and reach your goals faster.</p>
      </div>
      
      <ChevronRight size={18} className="shrink-0 text-[#8A9C92] transition-transform group-hover:translate-x-1" />
    </Link>
  )
}