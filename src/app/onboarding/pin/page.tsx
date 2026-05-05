import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import OnboardingPinForm from './OnboardingPinForm'

export default async function OnboardingPinPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const studentId = sp.student
  const skipHref = studentId ? `/play?student=${studentId}` : '/play'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={64}
            height={64}
            className="rounded-xl shadow-sm"
            priority
          />
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-[#1a2e1c]">
          One last optional step
        </h1>
        <p className="mb-6 text-center text-sm text-[#4a6b4e]">
          Add a 4-digit parent PIN so your child can stay in Student View on their own.
          The dashboard stays tucked away until you tap your PIN in.
        </p>

        <div className="rounded-2xl border border-[#bae0bd] bg-white p-6 shadow-sm">
          <OnboardingPinForm skipHref={skipHref} />
        </div>

        <p className="mt-5 text-center text-xs text-[#4a6b4e]">
          You can always set this up later from the dashboard.
        </p>

        <p className="mt-4 text-center text-sm text-[#4a6b4e]">
          <Link href={skipHref} className="text-[#2d6a35] hover:underline font-medium">
            Skip for now →
          </Link>
        </p>
      </div>
    </div>
  )
}
