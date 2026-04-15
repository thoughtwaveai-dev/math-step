'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createStudent(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = (formData.get('name') as string)?.trim()

  if (!name) return { error: 'Student name is required.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      name,
      parent_id: user.id,
      current_level: 1,
      current_sublevel: 1,
    })
    .select()
    .single()

  if (studentError) return { error: studentError.message }

  const { error: streakError } = await supabase
    .from('streaks')
    .insert({ student_id: student.id })

  if (streakError) return { error: streakError.message }

  redirect('/dashboard')
}
