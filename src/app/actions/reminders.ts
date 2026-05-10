'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error: string } | { success: string } | null

function isValidEmailFormat(value: string): boolean {
  const atIdx = value.indexOf('@')
  if (atIdx < 1 || value.includes(' ')) return false
  const afterAt = value.slice(atIdx + 1)
  const dotIdx = afterAt.lastIndexOf('.')
  return dotIdx >= 1 && dotIdx < afterAt.length - 1
}

export async function setRemindersEnabled(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const desired = formData.get('enabled') === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }

  const { error } = await supabase
    .from('profiles')
    .update({ reminders_enabled: desired })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: desired ? 'Daily reminders turned on.' : 'Daily reminders turned off.' }
}

export async function setWeeklyEnabled(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const desired = formData.get('enabled') === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_enabled: desired })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: desired ? 'Weekly recap turned on.' : 'Weekly recap turned off.' }
}

export async function setWeeklyCcEmail(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = formData.get('cc_email')
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''

  if (value !== '' && !isValidEmailFormat(value)) {
    return { error: 'Enter a valid email address.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }

  if (value !== '') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.email && profile.email.toLowerCase() === value) {
      return { error: 'This email is already the main account email.' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_cc_email: value || null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: value ? 'CC email saved.' : 'CC email removed.' }
}
