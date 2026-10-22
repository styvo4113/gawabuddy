import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FullScreenLoader } from '@/components/routing/FullScreenLoader'
import { StepAccounts } from '@/components/onboarding/StepAccounts'
import { StepIncome } from '@/components/onboarding/StepIncome'
import { StepTemplate } from '@/components/onboarding/StepTemplate'
import { useCompleteOnboarding } from '@/hooks/useOnboarding'
import { useProfile } from '@/hooks/useProfile'
import { newDraft, toPayload, validate } from '@/lib/onboarding'

const STEPS = 3

export default function Onboarding() {
  const navigate = useNavigate()
  const profile = useProfile()
  const complete = useCompleteOnboarding()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(newDraft)
  const [error, setError] = useState('')

  if (profile.isLoading) return <FullScreenLoader />
  if (profile.data?.onboarded) return <Navigate to="/" replace />

  function next() {
    const problem = validate(step, draft)
    if (problem) return setError(problem)
    setError('')
    setStep((s) => s + 1)
  }

  function back() {
    setError('')
    setStep((s) => s - 1)
  }

  function finish() {
    // REMOVED THE HARDCODED 50/30/20 SPLIT
    const problem = validate(step, draft)
    if (problem) return setError(problem)
    setError('')
    
    complete.mutate(toPayload(draft), {
      onSuccess: () => {
        toast.success('You are all set. Welcome to Gawa App!')
        navigate('/', { replace: true })
      },
      onError: (e) =>
        toast.error((e as { message?: string }).message || 'Could not finish setup. Try again.'),
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F5EC] p-4 pb-10">
      <div className="mx-auto max-w-md">
        <div className="pt-4">
          <p className="text-xs font-semibold text-[#6B7280]">
            Step {step + 1} of {STEPS}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9E4D4]" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
            <div className="h-full rounded-full bg-[#D4A017] transition-all" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
          </div>
        </div>

        <div className="mt-6">
          {step === 0 && <StepIncome draft={draft} onChange={setDraft} />}
          {step === 1 && <StepTemplate draft={draft} onChange={setDraft} />}
          {step === 2 && <StepAccounts draft={draft} onChange={setDraft} />}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-[#C0392B]">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={back} disabled={complete.isPending} className="h-12 flex-1 rounded-xl">
              Back
            </Button>
          )}
          {step < STEPS - 1 ? (
            <Button type="button" onClick={next} className="h-12 flex-1 rounded-xl">
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={complete.isPending} className="h-12 flex-1 rounded-xl">
              {complete.isPending ? 'Saving…' : 'Start Using Gawa'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}