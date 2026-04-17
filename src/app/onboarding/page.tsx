import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', user.id)

  const hasStudents = (count ?? 0) > 0

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={56}
            height={56}
            className="rounded-xl shadow-sm"
            priority
          />
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-[#1a2e1c]">
          {hasStudents ? 'Add another student' : 'Set up your student'}
        </h1>
        <p className="mb-7 text-center text-sm text-[#4a6b4e]">
          Enter your child&apos;s name to get started.
        </p>

        <div className="rounded-2xl border border-[#bae0bd] bg-white p-6 shadow-sm">
          <OnboardingForm />
        </div>

        {hasStudents && (
          <p className="mt-5 text-center text-sm text-[#4a6b4e]">
            <a href="/dashboard" className="text-[#2d6a35] hover:underline font-medium">
              ← Back to dashboard
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
