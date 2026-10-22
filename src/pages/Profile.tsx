import { useState, useRef, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { toast } from 'sonner'
import { Save, User, Camera, Mail } from 'lucide-react'
import DeleteAccountSection from '@/components/settings/DeleteAccountSection'
import { supabase } from '@/lib/supabase'

export default function Profile() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [uploading, setUploading] = useState(false)
  const [authEmail, setAuthEmail] = useState<string>('Loading...')

  // Fetch the email from the active session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setAuthEmail(session.user.email)
      } else {
        setAuthEmail('No email found')
      }
    })
  }, [])

  // Update name state if profile loads after initial render
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    }
  }, [profile?.full_name])

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Save the URL to the user's profile with detailed error logging
      updateProfile.mutate(
        { avatar_url: publicUrl },
        {
          onSuccess: () => toast.success('Profile photo updated!'),
          onError: (err: any) => {
            console.error("Database update error:", err)
            toast.error('Failed to save photo URL: ' + (err?.message || 'Unknown error'))
          },
        }
      )
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

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

      <section className="rounded-2xl border border-[#EFEAD8] bg-white p-6 shadow-sm dark:border-[#243b30] dark:bg-[#14291f]">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div 
              className="relative group flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-[#EFEAD8] bg-[#F8F5EC] dark:border-[#243b30] dark:bg-[#0c1b16]"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={32} className="text-[#9CA3AF]" />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-[#1F2937] dark:text-white">Profile Photo</p>
              <p className="mt-1 text-xs text-[#6B7280] dark:text-[#A9B8AF]">
                Click the circle to upload a new photo. JPG, PNG max 2MB.
              </p>
              {uploading && <p className="mt-2 text-xs font-bold text-[#D4A017]">Uploading...</p>}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="border-t border-[#EFEAD8] pt-6 dark:border-[#243b30]" />

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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
              <input
                type="email"
                value={authEmail}
                disabled
                className="w-full rounded-lg border border-[#EFEAD8] bg-[#F8F5EC] py-2 pl-10 pr-3 text-sm text-[#6B7280] outline-none dark:border-[#243b30] dark:bg-[#0c1b16] dark:text-[#A9B8AF] cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-[#6B7280] dark:text-[#A9B8AF]">
              Your email is used for login and cannot be changed here.
            </p>
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending || uploading}
            className="flex items-center gap-2 rounded-xl bg-[#0B3D2E] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#4ADE80] dark:text-[#031310]"
          >
            <Save size={16} />
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      <section className="pt-6 mt-6 border-t border-[#EFEAD8] dark:border-[#243b30]">
        <h2 className="mb-3 text-sm font-semibold text-[#C0392B]">Danger Zone</h2>
        <DeleteAccountSection />
      </section>
      
    </div>
  )
}