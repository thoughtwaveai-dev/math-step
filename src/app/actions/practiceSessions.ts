'use server'

import { createClient } from '@/lib/supabase/server'

interface RecordPracticeInput {
  studentId: string
  levelId: number
  problemType: string | null
  totalProblems: number
  correctCount: number
  accuracy: number
}

export async function recordPracticeSession(
  input: RecordPracticeInput
): Promise<{ error: string } | null> {
  const { studentId, levelId, problemType, totalProblems, correctCount, accuracy } = input

  if (!studentId || !Number.isFinite(levelId)) return { error: 'Invalid input.' }
  if (!Number.isInteger(totalProblems) || totalProblems <= 0) return { error: 'Invalid totals.' }
  if (!Number.isInteger(correctCount) || correctCount < 0 || correctCount > totalProblems) {
    return { error: 'Invalid correct count.' }
  }
  if (!Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100) {
    return { error: 'Invalid accuracy.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('practice_sessions')
    .insert({
      student_id: studentId,
      level_id: levelId,
      problem_type: problemType,
      total_problems: totalProblems,
      correct_count: correctCount,
      accuracy,
    })

  if (error) return { error: error.message }
  return null
}
