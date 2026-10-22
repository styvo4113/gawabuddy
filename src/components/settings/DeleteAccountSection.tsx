import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react'

export default function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE exactly to confirm.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call the Supabase Edge Function
      const { error: functionError } = await supabase.functions.invoke('delete-account')
      if (functionError) throw functionError

      // Sign out locally and redirect
      await supabase.auth.signOut()
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

          {/* Error Message */}
          {error && (
            <p className="mt-3 text-sm font-semibold text-[#C0392B]">
              {error}
            </p>
          )}

          {/* Initial State: Show the button to open the confirmation form */}
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#C0392B] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <Trash2 size={16} />
              Delete My Account
            </button>
          ) : (
            /* Confirmation State: Require typing "DELETE" */
            <div className="mt-4 rounded-xl border border-[#C0392B]/40 bg-white p-4 dark:border-[#C0392B]/40 dark:bg-[#061F1B]">
              <div className="flex items-center gap-2 text-[#C0392B] mb-2">
                <ShieldAlert size={18} />
                <p className="text-sm font-bold">Confirm Deletion</p>
              </div>
              
              <p className="text-xs text-[#6B7280] dark:text-[#9FB5B0] mb-3">
                To verify, type <strong className="text-[#C0392B]">DELETE</strong> in the box below.
              </p>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value)
                  setError(null)
                }}
                placeholder="Type DELETE here..."
                className="w-full rounded-lg border border-[#CFC8B0] bg-white px-3 py-2 text-sm font-bold tracking-widest text-[#1F2937] outline-none focus:border-[#C0392B] dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white dark:focus:border-[#C0392B]"
                disabled={loading}
              />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || confirmText !== 'DELETE'}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C0392B] px-4 py-2 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={16} />
                  {loading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
                
                <button
                  onClick={() => {
                    setShowConfirm(false)
                    setConfirmText('')
                    setError(null)
                  }}
                  disabled={loading}
                  className="rounded-lg border border-[#EFEAD8] px-4 py-2 text-sm font-bold text-[#1F2937] transition-colors hover:bg-[#F8F5EC] dark:border-[#243b30] dark:text-white dark:hover:bg-[#14291f]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}