// One-tap unsubscribe from the weekly review email footer.
// Public route — no Supabase auth required, so a tap from the email works
// without forcing a fresh login. Token is HMAC-signed by REMINDER_UNSUB_SECRET
// with a "weekly:" prefix so daily tokens cannot validate here.

import Link from 'next/link'
import Image from 'next/image'
import { verifyWeeklyUnsubscribeToken } from '@/lib/reminderToken'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Outcome =
  | { kind: 'success' }
  | { kind: 'invalid' }
  | { kind: 'error'; reason: string }

async function processUnsubscribe(rawToken: string | undefined): Promise<Outcome> {
  const parentId = verifyWeeklyUnsubscribeToken(rawToken ?? null)
  if (!parentId) return { kind: 'invalid' }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('profiles')
    .update({ weekly_enabled: false })
    .eq('id', parentId)

  if (error) return { kind: 'error', reason: error.message }
  return { kind: 'success' }
}

export default async function WeeklyUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const outcome = await processUnsubscribe(token)

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-lg font-bold text-[#1a2e1c]">MathStep</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <div className="rounded-xl border border-[#bae0bd] bg-white p-6">
          {outcome.kind === 'success' && (
            <>
              <h1 className="text-xl font-bold text-[#1a2e1c]">Weekly recap turned off</h1>
              <p className="mt-2 text-sm text-[#4a6b4e]">
                You won&apos;t get any more weekly progress emails from MathStep. You can turn them
                back on any time from Parent View → Admin controls.
              </p>
            </>
          )}

          {outcome.kind === 'invalid' && (
            <>
              <h1 className="text-xl font-bold text-[#1a2e1c]">This link looks expired</h1>
              <p className="mt-2 text-sm text-[#4a6b4e]">
                The unsubscribe link couldn&apos;t be verified. You can still manage weekly emails
                directly from Parent View — open MathStep and look for the toggle in Admin
                controls on the dashboard.
              </p>
            </>
          )}

          {outcome.kind === 'error' && (
            <>
              <h1 className="text-xl font-bold text-[#1a2e1c]">Something went wrong</h1>
              <p className="mt-2 text-sm text-[#4a6b4e]">
                We couldn&apos;t update your email settings just now. Please try again, or turn
                weekly emails off from Parent View on the dashboard.
              </p>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#2d6a35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
            >
              Open MathStep
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
