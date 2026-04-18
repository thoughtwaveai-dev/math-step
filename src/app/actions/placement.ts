'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { scorePlacement, PLACEMENT_QUESTIONS } from '@/lib/math/placement'

export type PlacementState =
  | null
  | { step: 'result'; level: number; sublevel: number; topic: string; explanation: string }
  | { error: string }

export async function runPlacementDiagnostic(
  _prevState: PlacementState,
  formData: FormData
): Promise<PlacementState> {
  const studentId = formData.get('student_id') as string
  if (!studentId) return { error: 'Missing student ID.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Student not found.' }

  const answers = PLACEMENT_QUESTIONS.map((_, i) =>
    (formData.get(`answer_${i}`) as string) ?? ''
  )
  const result = scorePlacement(answers)

  return { step: 'result', ...result }
}

export async function applyPlacement(formData: FormData): Promise<void> {
  const studentId = formData.get('student_id') as string
  const levelNumber = parseInt(formData.get('level') as string, 10)
  const sublevelNumber = parseInt(formData.get('sublevel') as string, 10)

  if (!studentId || isNaN(levelNumber) || isNaN(sublevelNumber)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!student) return

  const { data: level } = await supabase
    .from('levels')
    .select('id')
    .eq('level_number', levelNumber)
    .eq('sublevel_number', sublevelNumber)
    .maybeSingle()

  if (!level) return

  await supabase
    .from('students')
    .update({ current_level: levelNumber, current_sublevel: sublevelNumber })
    .eq('id', studentId)

  // Reset any stale progress for the new level (no-op if no row exists yet)
  await supabase
    .from('student_level_progress')
    .update({ consecutive_passes: 0, updated_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('level_id', level.id)

  redirect(`/play?student=${studentId}`)
}
