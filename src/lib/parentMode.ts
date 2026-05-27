import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const STUDENT_MODE_COOKIE = 'mathstep_student_mode'
export const SWITCHER_UNLOCKED_COOKIE = 'mathstep_switcher_unlocked'
export const LOCKED_STUDENT_COOKIE = 'mathstep_locked_student'
export const MAX_PIN_ATTEMPTS = 5
export const COOLDOWN_SECONDS = 30
export const SWITCHER_UNLOCK_MAX_AGE_SECONDS = 60 * 30
export const LOCKED_STUDENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

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

export async function isSwitcherUnlocked(): Promise<boolean> {
  const c = await cookies()
  return c.get(SWITCHER_UNLOCKED_COOKIE)?.value === 'on'
}

export async function setSwitcherUnlockedCookie() {
  const c = await cookies()
  try {
    c.set(SWITCHER_UNLOCKED_COOKIE, 'on', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SWITCHER_UNLOCK_MAX_AGE_SECONDS,
    })
  } catch {
    // Setting cookies from a Server Component is not supported.
  }
}

export async function clearSwitcherUnlockedCookie() {
  const c = await cookies()
  try {
    c.set(SWITCHER_UNLOCKED_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
  } catch {
    // Same as above.
  }
}

export async function getLockedStudentId(): Promise<string | null> {
  const c = await cookies()
  const value = c.get(LOCKED_STUDENT_COOKIE)?.value ?? null
  return value && value.length > 0 ? value : null
}

export async function setLockedStudentCookie(studentId: string) {
  const c = await cookies()
  try {
    c.set(LOCKED_STUDENT_COOKIE, studentId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: LOCKED_STUDENT_MAX_AGE_SECONDS,
    })
  } catch {
    // Same as above.
  }
}

export async function clearLockedStudentCookie() {
  const c = await cookies()
  try {
    c.set(LOCKED_STUDENT_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
  } catch {
    // Same as above.
  }
}

type StudentLike = { id: string }

/**
 * Pure resolver — decides which student record a student-aware page should
 * load given the URL ?student= param, the parent's PIN status, and the
 * device's switcher-lock cookies. Soft-fails on locked direct-URL attempts
 * (returns the locked student instead of the requested one).
 */
export function resolveActiveStudent<T extends StudentLike>(args: {
  requested: string | undefined | null
  students: T[]
  hasPin: boolean
  switcherUnlocked: boolean
  lockedStudentId: string | null
}): T {
  const { requested, students, hasPin, switcherUnlocked, lockedStudentId } = args
  const fallback = (id: string | undefined | null): T =>
    (id ? students.find(s => s.id === id) : null) ?? students[0]

  const hasMultiple = students.length > 1
  if (!hasMultiple || !hasPin || switcherUnlocked) {
    return fallback(requested)
  }

  // Locked: honor the locked-student cookie if it matches a real student;
  // otherwise fall back to the oldest student. Ignore the requested param.
  const lockedMatch = lockedStudentId
    ? students.find(s => s.id === lockedStudentId)
    : null
  return lockedMatch ?? students[0]
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
