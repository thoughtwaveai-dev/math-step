import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  clearSwitcherUnlockedCookie,
  getLockedStudentId,
  sanitizeNext,
} from '@/lib/parentMode'
import SwitcherUnlockForm from './SwitcherUnlockForm'

export default async function SwitcherUnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; student?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true })

  if (!students || students.length === 0) redirect('/onboarding')

  const sp = await searchParams
  const rawNext = sp.next ?? '/play'
  const next = sanitizeNext(rawNext.startsWith('/') ? rawNext : '/play')

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin, pin_locked_until')
    .eq('id', user.id)
    .maybeSingle()

  // No PIN saved? Switcher cannot be locked — drop any unlock cookie and continue.
  if (!profile?.parent_pin) {
    await clearSwitcherUnlockedCookie()
    redirect(next)
  }

  // Single-student accounts have no switching to do — bounce back.
  if (students.length <= 1) {
    redirect(`/play?student=${students[0].id}`)
  }

  const lockedStudentId = await getLockedStudentId()
  const preselect =
    sp.student && students.some(s => s.id === sp.student)
      ? sp.student
      : lockedStudentId && students.some(s => s.id === lockedStudentId)
        ? lockedStudentId
        : students[0].id

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
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full rounded-2xl border border-[#bae0bd] bg-white p-7 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e1f4e3] text-2xl">
              🔒
            </div>
            <h1 className="text-xl font-bold text-[#1a2e1c]">Switch student</h1>
            <p className="mt-1.5 text-sm text-[#4a6b4e]">
              Pop in the parent PIN to switch to another child&apos;s workbook.
            </p>
          </div>

          <SwitcherUnlockForm
            students={students}
            preselectStudentId={preselect}
            next={next}
            initialCooldownSeconds={cooldownSecondsRemaining}
          />
        </div>

        <p className="mt-5 text-center text-xs text-[#4a6b4e]">
          Not switching? <Link href="/play" className="font-medium text-[#2d6a35] hover:underline">Back to Student View</Link>
        </p>
      </main>
    </div>
  )
}
