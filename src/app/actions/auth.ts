'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  clearLockedStudentCookie,
  clearStudentModeCookie,
  clearSwitcherUnlockedCookie,
} from '@/lib/parentMode'

export async function signUp(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) return { error: error.message }

  await clearStudentModeCookie()
  await clearSwitcherUnlockedCookie()
  await clearLockedStudentCookie()
  redirect('/play')
}

export async function signIn(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  await clearStudentModeCookie()
  await clearSwitcherUnlockedCookie()
  await clearLockedStudentCookie()
  redirect('/play')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  await clearStudentModeCookie()
  await clearSwitcherUnlockedCookie()
  await clearLockedStudentCookie()
  redirect('/login')
}

// Supabase Auth error codes that mean the send failed for a reason unrelated to
// which account was asked for. Only these get reported back to the parent.
// Anything else (user_not_found, user_banned, email_not_confirmed, or any code
// added by a future Supabase release) stays silent, so this page can never be
// used to test which families have a MathStep account.
// `over_email_send_rate_limit` must never be added here. Audit 2026-08-16 tested
// it against the live project: a real account 429s on a second request inside
// 60s, while an address with no account returns 200 every time. Reporting it
// therefore answers "does this account exist?". It also has nothing to report,
// because that cooldown only fires when a reset email went out seconds earlier,
// which makes "Check your inbox" the truthful response.
const SEND_INFRASTRUCTURE_ERROR_CODES = new Set([
  'unexpected_failure',
  'request_timeout',
  'over_request_rate_limit',
  'email_address_not_authorized',
])

const SEND_FAILED_MESSAGE = 'Something went wrong on our end. Please try again in a few minutes.'

function isSendInfrastructureFailure(error: { code?: string; status?: number }): boolean {
  // An error raised before a response came back has neither code nor status
  // (or status 0), which means the request never reached Supabase.
  if (!error.code) return !error.status || error.status >= 500
  return SEND_INFRASTRUCTURE_ERROR_CODES.has(error.code)
}

export async function requestPasswordReset(
  _prevState: { sent: boolean; error?: string } | null,
  formData: FormData
): Promise<{ sent: boolean; error?: string }> {
  const email = ((formData.get('email') as string) ?? '').trim()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://mathstep.nz').replace(/\/$/, '')
  const redirectTo = `${appUrl}/auth/callback?next=/account/update-password`

  if (!email) return { sent: true }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    // Flat string, not an object: the dev logger serialises extra args to `{}`.
    console.error(
      `[requestPasswordReset] supabase error code=${error.code ?? 'none'} ` +
        `status=${error.status ?? 'none'} message=${error.message}`
    )
    if (isSendInfrastructureFailure(error)) {
      return { sent: false, error: SEND_FAILED_MESSAGE }
    }
  }

  return { sent: true }
}

export async function updatePassword(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const password = (formData.get('password') as string) ?? ''
  const confirm = (formData.get('confirm') as string) ?? ''

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'This reset link has expired. Please request a new one.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message }
  }

  await clearStudentModeCookie()
  await clearSwitcherUnlockedCookie()
  await clearLockedStudentCookie()
  redirect('/login?reset=1')
}
