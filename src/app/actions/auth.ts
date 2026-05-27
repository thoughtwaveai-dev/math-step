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

export async function requestPasswordReset(
  _prevState: { sent: boolean } | null,
  formData: FormData
): Promise<{ sent: boolean }> {
  const email = ((formData.get('email') as string) ?? '').trim()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://mathstep.nz').replace(/\/$/, '')
  const redirectTo = `${appUrl}/auth/callback?next=/account/update-password`

  if (email) {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      console.error('[requestPasswordReset] supabase error', error.message)
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
