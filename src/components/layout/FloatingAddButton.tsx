import { Plus } from 'lucide-react'

export function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40 grid size-14 place-items-center rounded-full bg-[#D4A017] text-primary shadow-[0_10px_30px_-8px_rgb(212_160_23/0.7)] transition hover:brightness-105 active:scale-95 md:hidden" 
    >
      <Plus className="size-7" strokeWidth={3} />
    </button>
  )
}