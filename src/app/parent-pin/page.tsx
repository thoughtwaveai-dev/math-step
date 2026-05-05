import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { clearStudentModeCookie, sanitizeNext } from '@/lib/parentMode'
import PinEntryForm from './PinEntryForm'

export default async function ParentPinPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin, pin_locked_until')
    .eq('id', user.id)
    .maybeSingle()

  const sp = await searchParams
  const next = sanitizeNext(sp.next ?? '/dashboard')

  // No PIN saved? Helper isn't needed — drop the cookie and continue.
  if (!profile?.parent_pin) {
    await clearStudentModeCookie()
    redirect(next)
  }

  const lockedUntil = profile.pin_locked_until ? new Date(profile.pin_locked_until) : null
  const cooldownSecondsRemaining = lockedUntil && lockedUntil.getTime() > Date.now()
    ? Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
    : 0

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/play" className="flex items-center gap-3">
            <Image
              src="/math-step-logo.png"
              alt="MathStep"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-[#1a2e1c]">MathStep</span>
          </Link>
          <Link
            href="/play"
            className="rounded-lg border border-[#bae0bd] bg-white px-3.5 py-2 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
          >
            ← Back to Student View
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full rounded-2xl border border-[#bae0bd] bg-white p-7 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e1f4e3] text-2xl">
              👪
            </div>
            <h1 className="text-xl font-bold text-[#1a2e1c]">This bit&apos;s for parents</h1>
            <p className="mt-1.5 text-sm text-[#4a6b4e]">
              Pop in the parent PIN to take a peek at progress.
            </p>
          </div>

          <PinEntryForm
            next={next}
            initialCooldownSeconds={cooldownSecondsRemaining}
          />

          <div className="mt-6 rounded-xl border border-[#e8f5e9] bg-[#f7faf7] p-4 text-center">
            <p className="text-sm font-medium text-[#1a2e1c]">
              Forgot your PIN? Log out and log back in to reset it from Parent View.
            </p>
            <form action={signOut} className="mt-3">
              <button
                type="submit"
                className="text-sm font-semibold text-[#2d6a35] hover:underline"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[#4a6b4e]">
          Want to keep playing? <Link href="/play" className="font-medium text-[#2d6a35] hover:underline">Back to Student View</Link>
        </p>
      </main>
    </div>
  )
}
