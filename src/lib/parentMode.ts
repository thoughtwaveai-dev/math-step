import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const STUDENT_MODE_COOKIE = 'mathstep_student_mode'
export const MAX_PIN_ATTEMPTS = 5
export const COOLDOWN_SECONDS = 30

export function sanitizeNext(next: string | undefined | null): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/')) return '/dashboard'
  if (next.startsWith('//')) return '/dashboard'
  return next
}

export async function isStudentModeActive(): Promise<boolean> {
  const c = await cookies()
  return c.get(STUDENT_MODE_COOKIE)?.value === 'on'
}

export async function setStudentModeCookie() {
  const c = await cookies()
  try {
    c.set(STUDENT_MODE_COOKIE, 'on', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch {
    // Setting cookies from a Server Component is not supported.
    // Server actions / route handlers handle the real writes.
  }
}

export async function clearStudentModeCookie() {
  const c = await cookies()
  try {
    c.set(STUDENT_MODE_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
  } catch {
    // Same as above — safe to call from anywhere.
  }
}

/**
 * Call at the top of parent-only server pages. If the visitor has flipped on
 * Student Mode and the parent has a PIN saved, send them to the soft PIN
 * helper before showing the page. Pages stay reachable when no PIN is set.
 */
export async function enforceParentMode(returnTo: string) {
  if (!(await isStudentModeActive())) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.parent_pin) {
    await clearStudentModeCookie()
    return
  }

  const safe = sanitizeNext(returnTo)
  redirect(`/parent-pin?next=${encodeURIComponent(safe)}`)
}
