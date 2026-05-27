'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hashPin, isValidPinFormat, verifyPin } from '@/lib/pin'
import {
  COOLDOWN_SECONDS,
  MAX_PIN_ATTEMPTS,
  clearLockedStudentCookie,
  clearStudentModeCookie,
  clearSwitcherUnlockedCookie,
  sanitizeNext,
  setLockedStudentCookie,
  setStudentModeCookie,
  setSwitcherUnlockedCookie,
} from '@/lib/parentMode'

type ActionResult = { error: string } | { success: string } | null

async function getAuthedUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function setPin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const currentPin = (formData.get('current_pin') as string | null)?.trim() ?? ''
  const newPin = (formData.get('new_pin') as string | null)?.trim() ?? ''
  const confirmPin = (formData.get('confirm_pin') as string | null)?.trim() ?? ''

  if (!isValidPinFormat(newPin)) {
    return { error: 'Please enter a 4-digit number for the new PIN.' }
  }
  if (newPin !== confirmPin) {
    return { error: "The two PIN entries don't match. Try again." }
  }

  const { supabase, userId } = await getAuthedUserId()
  if (!userId) return { error: 'Please sign in again.' }

  const { data: existing } = await supabase
    .from('profiles')
    .select('parent_pin')
    .eq('id', userId)
    .maybeSingle()

  if (existing?.parent_pin) {
    if (!isValidPinFormat(currentPin)) {
      return { error: 'Enter your current PIN to change it.' }
    }
    if (!verifyPin(currentPin, existing.parent_pin)) {
      return { error: "That current PIN doesn't match. Try again." }
    }
  }

  const hashed = hashPin(newPin)

  const { error } = await supabase
    .from('profiles')
    .update({
      parent_pin: hashed,
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  return { success: existing?.parent_pin ? 'PIN updated.' : 'PIN saved.' }
}

export async function removePin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const currentPin = (formData.get('current_pin') as string | null)?.trim() ?? ''

  const { supabase, userId } = await getAuthedUserId()
  if (!userId) return { error: 'Please sign in again.' }

  const { data: existing } = await supabase
    .from('profiles')
    .select('parent_pin')
    .eq('id', userId)
    .maybeSingle()

  if (!existing?.parent_pin) {
    return { error: 'There is no PIN saved on this account.' }
  }
  if (!isValidPinFormat(currentPin) || !verifyPin(currentPin, existing.parent_pin)) {
    return { error: "That PIN doesn't match. Try again." }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      parent_pin: null,
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  await clearStudentModeCookie()
  await clearSwitcherUnlockedCookie()
  await clearLockedStudentCookie()
  return { success: 'PIN removed.' }
}

export async function lockToStudentMode() {
  const { supabase, userId } = await getAuthedUserId()
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.parent_pin) {
    redirect('/dashboard?pin=needed')
  }

  await setStudentModeCookie()
  // Hand-over re-locks the switcher too; the locked-student cookie (if any)
  // is preserved so the device stays assigned to the same child.
  await clearSwitcherUnlockedCookie()

  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('parent_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  const first = students?.[0]?.id
  redirect(first ? `/play?student=${first}` : '/play')
}

export async function verifyPinAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const pin = (formData.get('pin') as string | null)?.trim() ?? ''
  const next = sanitizeNext((formData.get('next') as string | null) ?? '/dashboard')

  if (!isValidPinFormat(pin)) {
    return { error: 'PIN should be 4 digits.' }
  }

  const { supabase, userId } = await getAuthedUserId()
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin, pin_failed_attempts, pin_locked_until')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.parent_pin) {
    await clearStudentModeCookie()
    redirect(next)
  }

  if (profile.pin_locked_until) {
    const until = new Date(profile.pin_locked_until).getTime()
    if (until > Date.now()) {
      const secs = Math.ceil((until - Date.now()) / 1000)
      return { error: `Just a moment — try again in ${secs}s.` }
    }
  }

  if (verifyPin(pin, profile.parent_pin)) {
    await supabase
      .from('profiles')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', userId)

    await clearStudentModeCookie()
    redirect(next)
  }

  const nextAttempts = (profile.pin_failed_attempts ?? 0) + 1
  if (nextAttempts >= MAX_PIN_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + COOLDOWN_SECONDS * 1000)
    await supabase
      .from('profiles')
      .update({ pin_failed_attempts: 0, pin_locked_until: lockedUntil.toISOString() })
      .eq('id', userId)
    return { error: `That wasn't quite right. Take a short break — try again in ${COOLDOWN_SECONDS}s.` }
  }

  await supabase
    .from('profiles')
    .update({ pin_failed_attempts: nextAttempts })
    .eq('id', userId)

  const remaining = MAX_PIN_ATTEMPTS - nextAttempts
  return {
    error: remaining === 1
      ? "That doesn't match. One more try before a short break."
      : "That doesn't match. Try again.",
  }
}

export async function verifySwitcherPinAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const pin = (formData.get('pin') as string | null)?.trim() ?? ''
  const targetStudent = ((formData.get('student') as string | null) ?? '').trim()
  const rawNext = (formData.get('next') as string | null) ?? '/play'
  const next = sanitizeNext(rawNext.startsWith('/') ? rawNext : '/play')

  if (!isValidPinFormat(pin)) {
    return { error: 'PIN should be 4 digits.' }
  }

  const { supabase, userId } = await getAuthedUserId()
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin, pin_failed_attempts, pin_locked_until')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.parent_pin) {
    // No PIN saved — switcher cannot be locked. Drop any unlock cookie and continue.
    await clearSwitcherUnlockedCookie()
    redirect(targetStudent ? `/play?student=${targetStudent}` : next)
  }

  if (profile.pin_locked_until) {
    const until = new Date(profile.pin_locked_until).getTime()
    if (until > Date.now()) {
      const secs = Math.ceil((until - Date.now()) / 1000)
      return { error: `Just a moment — try again in ${secs}s.` }
    }
  }

  if (verifyPin(pin, profile.parent_pin)) {
    await supabase
      .from('profiles')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', userId)

    await setSwitcherUnlockedCookie()

    // Validate the requested student belongs to this parent before redirecting.
    // Also persist the pick as the device's locked student — otherwise after the
    // 30-min unlock cookie expires the device would silently revert to students[0].
    if (targetStudent) {
      const { data: ownedStudent } = await supabase
        .from('students')
        .select('id')
        .eq('id', targetStudent)
        .eq('parent_id', userId)
        .maybeSingle()
      if (ownedStudent) {
        await setLockedStudentCookie(ownedStudent.id)
        redirect(`/play?student=${ownedStudent.id}`)
      }
    }
    redirect(next)
  }

  const nextAttempts = (profile.pin_failed_attempts ?? 0) + 1
  if (nextAttempts >= MAX_PIN_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + COOLDOWN_SECONDS * 1000)
    await supabase
      .from('profiles')
      .update({ pin_failed_attempts: 0, pin_locked_until: lockedUntil.toISOString() })
      .eq('id', userId)
    return { error: `That wasn't quite right. Take a short break — try again in ${COOLDOWN_SECONDS}s.` }
  }

  await supabase
    .from('profiles')
    .update({ pin_failed_attempts: nextAttempts })
    .eq('id', userId)

  const remaining = MAX_PIN_ATTEMPTS - nextAttempts
  return {
    error: remaining === 1
      ? "That doesn't match. One more try before a short break."
      : "That doesn't match. Try again.",
  }
}

export async function lockStudentSwitcher(formData: FormData) {
  const targetStudent = ((formData.get('student') as string | null) ?? '').trim()

  const { supabase, userId } = await getAuthedUserId()
  if (!userId) redirect('/login')

  if (targetStudent) {
    const { data: ownedStudent } = await supabase
      .from('students')
      .select('id')
      .eq('id', targetStudent)
      .eq('parent_id', userId)
      .maybeSingle()
    if (ownedStudent) {
      await setLockedStudentCookie(ownedStudent.id)
      await clearSwitcherUnlockedCookie()
      redirect(`/play?student=${ownedStudent.id}`)
    }
  }

  await clearSwitcherUnlockedCookie()
  redirect('/play')
}
