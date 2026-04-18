'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/math/gradeAnswer'

export async function submitSelfCorrection(
  _prevState: { error: string; correct: boolean } | null,
  formData: FormData
): Promise<{ error: string; correct: boolean }> {
  const problemId = formData.get('problem_id') as string
  const sessionId = formData.get('session_id') as string
  const studentAnswer = ((formData.get('correction_answer') as string) ?? '').trim()

  if (!problemId || !sessionId) return { error: 'Missing data.', correct: false }
  if (!studentAnswer) return { error: 'Enter an answer.', correct: false }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.', correct: false }

  // Verify session ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('student_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return { error: 'Session not found.', correct: false }

  const { data: ownerCheck } = await supabase
    .from('students')
    .select('id')
    .eq('id', session.student_id)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!ownerCheck) return { error: 'Access denied.', correct: false }

  // Fetch the problem — must belong to this session and be incorrect
  const { data: problem } = await supabase
    .from('problems')
    .select('correct_answer, is_correct, self_corrected')
    .eq('id', problemId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (!problem) return { error: 'Problem not found.', correct: false }
  if (problem.is_correct) return { error: 'Problem is already correct.', correct: false }
  if (problem.self_corrected) return { error: 'Already corrected.', correct: true }

  const isCorrect = gradeAnswer(studentAnswer, problem.correct_answer)

  if (!isCorrect) {
    return { error: "That's not quite right — try again.", correct: false }
  }

  await supabase
    .from('problems')
    .update({ self_corrected: true })
    .eq('id', problemId)

  revalidatePath(`/worksheet/results/${sessionId}`)
  return { error: '', correct: true }
}
