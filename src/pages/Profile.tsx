import { useState } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { toast } from 'sonner'
import { Save, User } from 'lucide-react'
import DeleteAccountSection from '@/components/settings/DeleteAccountSection'

export default function Profile() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate(
      { full_name: fullName },
      {
        onSuccess: () => toast.success('Profile updated successfully'),
        onError: () => toast.error('Could not update profile'),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F5EC] dark:bg-[#031310]">
        <p className="text-sm text-[#6B7280] dark:text-[#A9B8AF]">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-28">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[#0B3D2E]/10 p-3 text-[#0B3D2E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0B3D2E] dark:text-white">Your Profile</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#A9B8AF]">Manage your personal details.</p>
        </div>
      </div>

      {/* Profile Form */}
      <section className="rounded-2xl border border-[#EFEAD8] bg-white p-6 shadow-sm dark:border-[#243b30] dark:bg-[#14291f]">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1F2937] dark:text-white mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[#CFC8B0] bg-white px-3 py-2 text-sm text-[#1F2937] outline-none focus:border-[#D4A017] dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-white"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937] dark:text-white mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-[#EFEAD8] bg-[#F8F5EC] px-3 py-2 text-sm text-[#6B7280] outline-none dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-[#A9B8AF] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[#6B7280] dark:text-[#A9B8AF]">
              Email cannot be changed here.
            </p>
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 rounded-xl bg-[#0B3D2E] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#4ADE80] dark:text-[#031310]"
          >
            <Save size={16} />
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* DANGER ZONE (Delete Account) */}
      <section className="pt-6 mt-6 border-t border-[#EFEAD8] dark:border-[#243b30]">
        <h2 className="mb-3 text-sm font-semibold text-[#C0392B]">Danger Zone</h2>
        <DeleteAccountSection />
      </section>
    </div>
  )
}