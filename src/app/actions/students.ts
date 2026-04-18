'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateStudentPlacement(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const studentId = formData.get('student_id') as string
  const placement = formData.get('placement') as string

  if (!studentId || !placement) return { error: 'Invalid input.' }

  const [lvlStr, sublvlStr] = placement.split(':')
  const levelNumber = parseInt(lvlStr, 10)
  const sublevelNumber = parseInt(sublvlStr, 10)

  if (isNaN(levelNumber) || isNaN(sublevelNumber)) return { error: 'Invalid level selection.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Verify authenticated parent owns this student
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Student not found or access denied.' }

  // Verify the target level exists in the curriculum
  const { data: level } = await supabase
    .from('levels')
    .select('id')
    .eq('level_number', levelNumber)
    .eq('sublevel_number', sublevelNumber)
    .maybeSingle()

  if (!level) return { error: 'Selected level does not exist.' }

  // Update the student's placement
  const { error: updateErr } = await supabase
    .from('students')
    .update({ current_level: levelNumber, current_sublevel: sublevelNumber })
    .eq('id', studentId)

  if (updateErr) return { error: updateErr.message }

  // Reset consecutive_passes for the new level so stale progress doesn't carry over
  await supabase
    .from('student_level_progress')
    .update({ consecutive_passes: 0, updated_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('level_id', level.id)

  redirect(`/dashboard?student=${studentId}`)
}

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

  const startMode = (formData.get('start_mode') as string) ?? 'default'

  if (startMode === 'diagnostic') {
    redirect(`/placement?student=${student.id}`)
  }

  // Count students owned before this insert to decide where to land
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', user.id)
    .neq('id', student.id)

  const isFirstStudent = (count ?? 0) === 0
  if (isFirstStudent) {
    redirect(`/play?student=${student.id}`)
  } else {
    redirect(`/dashboard?student=${student.id}`)
  }
}
