'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error: string } | { success: string } | null

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
