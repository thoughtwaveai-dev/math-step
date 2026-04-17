'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Normalize an inequality answer string for comparison.
// Accepts Unicode symbols (≤ ≥) and normalizes whitespace so "x > 4", "x>4", "X > 4" all match.
function normalizeInequality(s: string): string {
  return s.trim()
    .toLowerCase()
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/\s+/g, '')
}

// For multi-token answers (factors, prime factorization) sort extracted numbers for order-insensitive comparison.
// For single-number answers (addition, GCF, LCM) compare integers directly so "12" doesn't match "21".
// For inequality answers (contain < or >) normalize whitespace and operator notation.
function gradeAnswer(studentAnswer: string, correctAnswer: string): boolean {
  if (!studentAnswer.trim()) return false

  // Inequality answers: correctAnswer contains < or >
  if (/[<>]/.test(correctAnswer)) {
    return normalizeInequality(studentAnswer) === normalizeInequality(correctAnswer)
  }

  const correctNums = (correctAnswer.match(/\d+/g) ?? []).map(Number)

  if (correctNums.length === 1) {
    // Single-number answer: exact integer match
    const studentNum = parseInt(studentAnswer.trim(), 10)
    return !isNaN(studentNum) && studentNum === correctNums[0]
  }

  // Multi-token answer: sort extracted numbers for order-insensitive comparison
  const normalize = (s: string) =>
    (s.match(/\d+/g) ?? []).map(Number).sort((a, b) => a - b).join(' ')
  return normalize(studentAnswer) === normalize(correctAnswer)
}

export async function submitWorksheet(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const sessionId = formData.get('session_id') as string
  const timeTaken = parseInt((formData.get('time_taken_seconds') as string) ?? '0', 10)

  if (!sessionId) return { error: 'Session ID missing.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Fetch session to verify it exists and isn't already completed (RLS enforces ownership)
  const { data: session } = await supabase
    .from('sessions')
    .select('level_id, completed_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return { error: 'Session not found.' }
  if (session.completed_at) return { error: 'This worksheet has already been submitted.' }

  // Fetch problems for the session
  const { data: problems, error: fetchError } = await supabase
    .from('problems')
    .select('id, correct_answer')
    .eq('session_id', sessionId)
    .order('order_index')

  if (fetchError || !problems || problems.length === 0) {
    return { error: 'Problems not found for this session.' }
  }

  // Grade each problem and update the row
  let correctCount = 0
  for (const problem of problems) {
    const studentAnswer = ((formData.get(`answer_${problem.id}`) as string) ?? '').trim()
    const isCorrect = gradeAnswer(studentAnswer, problem.correct_answer)
    if (isCorrect) correctCount++

    const { error: updateErr } = await supabase
      .from('problems')
      .update({ student_answer: studentAnswer, is_correct: isCorrect })
      .eq('id', problem.id)

    if (updateErr) return { error: `Failed to save answer: ${updateErr.message}` }
  }

  const totalProblems = problems.length
  // numeric(5,2) — store as a float rounded to 2 decimal places
  const accuracy = Math.round((correctCount / totalProblems) * 10000) / 100

  // Fetch level thresholds + consecutive passes required
  const { data: level } = await supabase
    .from('levels')
    .select('accuracy_threshold, speed_target_seconds, consecutive_passes_required')
    .eq('id', session.level_id)
    .maybeSingle()

  const threshold = level?.accuracy_threshold ?? 90
  const speedTarget = level?.speed_target_seconds ?? null
  // Pass requires accuracy threshold AND (if speed target set) time within target
  const passed =
    accuracy >= threshold &&
    (speedTarget === null || timeTaken <= speedTarget)

  // Complete the session
  const { error: sessionUpdateErr } = await supabase
    .from('sessions')
    .update({
      completed_at: new Date().toISOString(),
      time_taken_seconds: timeTaken,
      total_problems: totalProblems,
      correct_count: correctCount,
      accuracy,
      passed,
    })
    .eq('id', sessionId)

  if (sessionUpdateErr) return { error: sessionUpdateErr.message }

  // Fetch session's student_id (needed for streak + level progress updates)
  const { data: sessionRow } = await supabase
    .from('sessions')
    .select('student_id')
    .eq('id', sessionId)
    .maybeSingle()

  // Track advancement info for results page redirect
  let advancedToLevel: number | null = null
  let advancedToSublevel: number | null = null
  let advancedToTopic: string | null = null

  if (sessionRow?.student_id) {
    const studentId = sessionRow.student_id

    // --- Streak update ---
    const { data: currentStreak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak, total_sessions, total_points, last_session_date')
      .eq('student_id', studentId)
      .maybeSingle()

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const lastDate = currentStreak?.last_session_date ?? null

    const prevStreak = currentStreak?.current_streak ?? 0
    let newStreak = prevStreak
    if (lastDate === null) {
      newStreak = 1
    } else if (lastDate === today) {
      newStreak = prevStreak
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      newStreak = lastDate === yesterdayStr ? prevStreak + 1 : 1
    }

    const prevLongest = currentStreak?.longest_streak ?? 0
    const points = passed ? 15 : 10

    const { error: streakErr } = await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(prevLongest, newStreak),
        total_sessions: (currentStreak?.total_sessions ?? 0) + 1,
        total_points: (currentStreak?.total_points ?? 0) + points,
        last_session_date: today,
      })
      .eq('student_id', studentId)

    if (streakErr) console.error('Streak update failed:', streakErr.message)

    // --- Consecutive pass tracking ---
    // Fetch existing progress row for this student + level
    const { data: existingProgress } = await supabase
      .from('student_level_progress')
      .select('id, consecutive_passes')
      .eq('student_id', studentId)
      .eq('level_id', session.level_id)
      .maybeSingle()

    const prevConsecutivePasses = existingProgress?.consecutive_passes ?? 0
    const newConsecutivePasses = passed ? prevConsecutivePasses + 1 : 0

    if (existingProgress) {
      const { error: progressErr } = await supabase
        .from('student_level_progress')
        .update({
          consecutive_passes: newConsecutivePasses,
          last_result_passed: passed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
      if (progressErr) console.error('Level progress update failed:', progressErr.message)
    } else {
      const { error: progressErr } = await supabase
        .from('student_level_progress')
        .insert({
          student_id: studentId,
          level_id: session.level_id,
          consecutive_passes: newConsecutivePasses,
          last_result_passed: passed,
          updated_at: new Date().toISOString(),
        })
      if (progressErr) console.error('Level progress insert failed:', progressErr.message)
    }

    // --- Level advancement check ---
    const passesRequired = level?.consecutive_passes_required ?? null
    if (passed && passesRequired !== null && newConsecutivePasses >= passesRequired) {
      // Find the student's current level/sublevel to determine next step
      const { data: student } = await supabase
        .from('students')
        .select('current_level, current_sublevel')
        .eq('id', studentId)
        .maybeSingle()

      if (student) {
        // Find the next level in curriculum order (level_number asc, sublevel_number asc)
        const { data: nextLevel } = await supabase
          .from('levels')
          .select('id, level_number, sublevel_number, topic')
          .or(
            `level_number.gt.${student.current_level},and(level_number.eq.${student.current_level},sublevel_number.gt.${student.current_sublevel})`
          )
          .order('level_number', { ascending: true })
          .order('sublevel_number', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextLevel) {
          // Advance the student
          const { error: advanceErr } = await supabase
            .from('students')
            .update({
              current_level: nextLevel.level_number,
              current_sublevel: nextLevel.sublevel_number,
            })
            .eq('id', studentId)

          if (!advanceErr) {
            advancedToLevel = nextLevel.level_number
            advancedToSublevel = nextLevel.sublevel_number
            advancedToTopic = nextLevel.topic

            // Reset consecutive passes for the old level so advancement doesn't re-trigger
            await supabase
              .from('student_level_progress')
              .update({ consecutive_passes: 0, updated_at: new Date().toISOString() })
              .eq('student_id', studentId)
              .eq('level_id', session.level_id)
          } else {
            console.error('Student advancement failed:', advanceErr.message)
          }
        }
        // If no next level, student stays at current level — no action needed
      }
    }
  }

  // Build redirect URL, including advancement info if applicable
  const params = new URLSearchParams()
  if (advancedToLevel !== null) {
    params.set('advanced', '1')
    params.set('nl', String(advancedToLevel))
    params.set('ns', String(advancedToSublevel))
    if (advancedToTopic) params.set('nt', advancedToTopic)
  }
  const resultUrl = `/worksheet/results/${sessionId}${params.size > 0 ? `?${params.toString()}` : ''}`
  redirect(resultUrl)
}
