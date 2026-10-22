import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Ensure this matches your project's supabase client path
import { AlertTriangle, Trash2 } from 'lucide-react'

export default function DeleteAccountSection() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    // 1. Double confirmation check
    const confirmed = window.confirm(
      "WARNING: Are you sure you want to permanently delete your account? All your data, transactions, and goals will be lost forever. This action CANNOT be undone."
    )
    
    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      // 2. Call the Supabase Edge Function
      const { error: functionError } = await supabase.functions.invoke('delete-account')

      if (functionError) throw functionError

      // 3. Sign out locally and redirect to login/register
      await supabase.auth.signOut()
      
      // Use window.location to force a hard reload and clear any cached user data
      window.location.href = '/login' 
      
    } catch (err: any) {
      console.error('Delete account error:', err)
      setError(err.message || 'Failed to delete account. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#C0392B]/30 bg-[#C0392B]/5 p-6 dark:border-[#C0392B]/40 dark:bg-[#C0392B]/10">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-[#C0392B]/10 p-2 text-[#C0392B] dark:bg-[#C0392B]/20">
          <AlertTriangle size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#1F2937] dark:text-[#F5F8F7]">
            Delete Account
          </h3>
          <p className="mt-1 text-sm text-[#6B7280] dark:text-[#9FB5B0]">
            Once you delete your account, there is no going back. All your data will be permanently removed. 
            You can register again later with the same email address.
          </p>

          {error && (
            <p className="mt-3 text-sm font-semibold text-[#C0392B]">
              {error}
            </p>
          )}

          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="mt-4 flex items-center gap-2 rounded-xl bg-[#C0392B] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            {loading ? 'Deleting Account...' : 'Permanently Delete Account'}
          </button>
        </div>
      </div>
    </div>
  )
}