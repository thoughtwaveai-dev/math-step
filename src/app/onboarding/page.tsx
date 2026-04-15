import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Set up your student</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Enter your student&apos;s name to get started.
        </p>
        <OnboardingForm />
      </div>
    </div>
  )
}
