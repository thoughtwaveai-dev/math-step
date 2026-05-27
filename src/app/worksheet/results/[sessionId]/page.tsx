import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import CelebrationEffect from './CelebrationEffect'
import CorrectionInput from './CorrectionInput'
import BackToTop from './BackToTop'
import { isStudentStuck } from '@/lib/stuckDetector'
import { detectSessionMilestones } from '@/lib/achievements'
import {
  getLockedStudentId,
  isSwitcherUnlocked,
} from '@/lib/parentMode'

function formatTime(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

interface Problem {
  id: string
  order_index: number
  problem_text: string
  correct_answer: string
  student_answer: string | null
  is_correct: boolean | null
  self_corrected: boolean | null
}

interface Session {
  id: string
  level_id: number
  completed_at: string | null
  time_taken_seconds: number | null
  total_problems: number | null
  correct_count: number | null
  accuracy: number | null
  passed: boolean | null
  problems: Problem[]
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ advanced?: string; nl?: string; ns?: string; nt?: string; clc?: string; clt?: string }>
}) {
  const { sessionId } = await params
  const sp = await searchParams
  const didAdvance = sp.advanced === '1'
  const newLevel = sp.nl ? parseInt(sp.nl, 10) : null
  const newSublevel = sp.ns ? parseInt(sp.ns, 10) : null
  const newTopic = sp.nt ?? null
  const paramClc = sp.clc !== undefined ? parseInt(sp.clc, 10) : null
  const paramClt = sp.clt !== undefined ? parseInt(sp.clt, 10) : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch session first, then verify the student belongs to this parent
  const { data: session } = await supabase
    .from('sessions')
    .select('*, problems(*)')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) redirect('/dashboard')

  // Verify ownership: session's student must belong to this parent (RLS on students)
  const { data: ownerCheck } = await supabase
    .from('students')
    .select('id')
    .eq('id', session.student_id)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!ownerCheck) redirect('/dashboard')

  const studentId = session.student_id as string

  // Switcher-lock soft fail: if the parent has set a PIN, the device is locked
  // to a specific student, and this session belongs to a different student,
  // bounce back to /play. Single-student or unlocked sessions are unaffected.
  // When the locked-student cookie isn't set yet, fall back to students[0] to
  // mirror the resolver's behavior on /play.
  const [switcherUnlocked, lockedStudentId, parentStudents] = await Promise.all([
    isSwitcherUnlocked(),
    getLockedStudentId(),
    supabase
      .from('students')
      .select('id')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true })
      .then(r => r.data ?? []),
  ])
  if (parentStudents.length > 1 && !switcherUnlocked) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('parent_pin')
      .eq('id', user.id)
      .maybeSingle()
    if (profileRow?.parent_pin) {
      const effectiveLocked =
        lockedStudentId && parentStudents.some(s => s.id === lockedStudentId)
          ? lockedStudentId
          : parentStudents[0].id
      if (effectiveLocked !== studentId) {
        redirect(`/play?student=${effectiveLocked}`)
      }
    }
  }

  const typedSession = session as Session
  if (!typedSession.completed_at) redirect('/worksheet')

  // Fetch level progress for this session's level
  const { data: levelProgress } = await supabase
    .from('student_level_progress')
    .select('consecutive_passes')
    .eq('student_id', studentId)
    .eq('level_id', typedSession.level_id)
    .maybeSingle()

  // Fetch level metadata for passes required + speed target (for beat-time milestone)
  const { data: levelMeta } = await supabase
    .from('levels')
    .select('consecutive_passes_required, topic, level_number, sublevel_number, speed_target_seconds')
    .eq('id', typedSession.level_id)
    .maybeSingle()

  // Streak row drives session-count and streak milestones — pulled with .maybeSingle()
  const { data: streakRow } = await supabase
    .from('streaks')
    .select('current_streak, total_sessions')
    .eq('student_id', studentId)
    .maybeSingle()

  const consecutivePasses = levelProgress?.consecutive_passes ?? 0
  const passesRequired = levelMeta?.consecutive_passes_required ?? null

  // Stuck detection: last 5 sessions for this student at this level, most recent first
  const { data: recentLevelSessions } = await supabase
    .from('sessions')
    .select('passed')
    .eq('student_id', studentId)
    .eq('level_id', typedSession.level_id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(5)

  const recentResults = (recentLevelSessions ?? []).map(s => s.passed ?? false)
  const isStuck = isStudentStuck(recentResults)

  const problems = [...typedSession.problems].sort((a, b) => a.order_index - b.order_index)

  const correctCount = typedSession.correct_count ?? 0
  const totalProblems = typedSession.total_problems ?? problems.length
  const accuracy = typedSession.accuracy ? Number(typedSession.accuracy) : 0
  const passed = typedSession.passed ?? false

  // Mixed worksheet: review problems were included when current-level total < overall total
  const clcCount = paramClc ?? correctCount
  const cltCount = (paramClt !== null && paramClt > 0) ? paramClt : totalProblems
  const hasMixedProblems = cltCount < totalProblems
  const reviewCount = totalProblems - cltCount
  const currentLevelAccuracyPct = Math.round((clcCount / cltCount) * 100)

  const showCelebration = accuracy === 100

  const incorrectProblems = problems.filter(p => !p.is_correct)
  const correctedCount = incorrectProblems.filter(p => p.self_corrected).length
  const allCorrected = incorrectProblems.length > 0 && correctedCount === incorrectProblems.length

  // Milestones unlocked by this session — additive, not duplicating Level Up banner.
  // Streak milestones intentionally skipped here: current_streak reflects "right now",
  // not the moment the session was completed, so showing them on a revisited old
  // results page would be misleading. Streak achievements live on dashboard/play instead.
  const sessionMilestones = detectSessionMilestones({
    totalSessionsAfter: streakRow?.total_sessions ?? 0,
    accuracy,
    passed,
    timeTakenSeconds: typedSession.time_taken_seconds ?? null,
    speedTargetSeconds: levelMeta?.speed_target_seconds ?? null,
    allMistakesCorrected: allCorrected,
  })

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      {showCelebration && <CelebrationEffect />}
      <BackToTop />
      {/* Header */}
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
          </div>
          <Link
            href={`/play?student=${studentId}`}
            className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            ← Play
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-5">
        <h1 className="text-2xl font-bold text-[#1a2e1c]">Worksheet Results</h1>

        {/* Score summary card */}
        <div
          className={`rounded-2xl border p-6 ${
            passed
              ? 'border-[#bae0bd] bg-[#e1f4e3]'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold ${
                passed
                  ? 'bg-[#2d6a35] text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {passed ? '✓ Passed' : '✗ Not passed'}
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Score</dt>
              <dd className="mt-1 text-3xl font-bold text-[#1a2e1c]">
                {correctCount}/{totalProblems}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Accuracy</dt>
              <dd className="mt-1 text-3xl font-bold text-[#1a2e1c]">{accuracy}%</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Time</dt>
              <dd className="mt-1 text-3xl font-bold text-[#1a2e1c]">
                {formatTime(typedSession.time_taken_seconds)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Milestones unlocked by this session */}
        {sessionMilestones.length > 0 && (
          <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
            <p className="text-sm font-semibold text-[#1a2e1c] mb-3">Milestones unlocked</p>
            <ul className="flex flex-wrap gap-2">
              {sessionMilestones.map((m) => (
                <li
                  key={m.title}
                  className="inline-flex items-center gap-2 rounded-full border border-[#bae0bd] bg-[#f2faf3] px-3 py-1.5"
                >
                  <span aria-hidden="true">{m.emoji}</span>
                  <span className="text-xs font-semibold text-[#1a2e1c]">{m.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Level advancement banner */}
        {didAdvance && newLevel !== null && newSublevel !== null && (
          <div className="rounded-xl border border-[#bae0bd] bg-[#e1f4e3] p-5">
            <p className="text-base font-bold text-[#1a2e1c]">Level Up!</p>
            <p className="mt-1 text-sm text-[#2d6a35]">
              Advanced to Level {newLevel}.{newSublevel}{newTopic ? ` — ${newTopic}` : ''}.
            </p>
          </div>
        )}

        {/* Mastery progress */}
        {!didAdvance && passesRequired !== null && (
          <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
            <p className="text-sm font-semibold text-[#1a2e1c]">
              Mastery progress:{' '}
              <span className="text-[#2d6a35]">
                {consecutivePasses} / {passesRequired} passes
              </span>
            </p>
            {hasMixedProblems && (
              <p className="mt-1.5 text-xs text-[#4a6b4e]">
                This worksheet included {reviewCount} review problem{reviewCount === 1 ? '' : 's'} from earlier levels.
                Score on new material: <span className="font-medium text-[#1a2e1c]">{clcCount}/{cltCount} ({currentLevelAccuracyPct}%)</span> — only this counts towards your pass.
              </p>
            )}
            {passed && (
              <p className="mt-1 text-xs text-[#4a6b4e]">
                {consecutivePasses >= passesRequired
                  ? 'Mastery reached!'
                  : `${passesRequired - consecutivePasses} more passing session${passesRequired - consecutivePasses === 1 ? '' : 's'} to advance.`}
              </p>
            )}
            {!passed && (
              <p className="mt-1 text-xs text-[#4a6b4e]">
                Consecutive passes reset to 0/{passesRequired}. Keep going!
              </p>
            )}
          </div>
        )}

        {/* Stuck support message — shown when student has failed multiple recent sessions */}
        {isStuck && !passed && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">This level is feeling tough right now — that&apos;s okay.</p>
            <p className="mt-1 text-sm text-amber-800">
              Try again tomorrow, or ask a parent to go through the worked example together before the next session.
              If it keeps feeling hard, a parent can adjust the starting level from the dashboard.
            </p>
          </div>
        )}

        {/* Self-correction completion message */}
        {incorrectProblems.length > 0 && (
          allCorrected ? (
            <div className="rounded-xl border border-[#bae0bd] bg-[#e1f4e3] p-5">
              <p className="text-sm font-semibold text-[#1a2e1c]">Great work fixing your mistakes!</p>
              <p className="mt-1 text-sm text-[#2d6a35]">
                You went back and corrected every wrong answer. That&apos;s exactly how learning works.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">
                {correctedCount > 0
                  ? `Good start — ${incorrectProblems.length - correctedCount} more to go.`
                  : 'Try to fix the ones you got wrong below.'}
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Correcting your mistakes helps you remember. Give it a try — no pressure.
              </p>
            </div>
          )
        )}

        {/* Problem review */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#1a2e1c]">Problem Review</h2>

          {problems.map((problem, index) => (
            <div
              key={problem.id}
              className={`rounded-xl border bg-white p-5 ${
                problem.is_correct ? 'border-[#bae0bd]' : 'border-red-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    problem.is_correct
                      ? 'bg-[#e1f4e3] text-[#2d6a35]'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {problem.is_correct ? '✓' : '✗'}
                </span>

                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-[#4a6b4e]">Problem {index + 1}</p>
                  <p className="text-base font-semibold text-[#1a2e1c]">{problem.problem_text}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                        Your answer
                      </p>
                      <p
                        className={`mt-0.5 font-semibold ${
                          problem.is_correct ? 'text-[#2d6a35]' : 'text-red-600'
                        }`}
                      >
                        {problem.student_answer || (
                          <span className="italic text-[#a0b8a3]">no answer</span>
                        )}
                      </p>
                    </div>

                    {!problem.is_correct && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                          Correct answer
                        </p>
                        <p className="mt-0.5 font-semibold text-[#2d6a35]">
                          {problem.correct_answer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Self-correction UI — only for incorrect problems */}
                  {!problem.is_correct && (
                    problem.self_corrected ? (
                      <div className="mt-3">
                        <span className="inline-flex items-center rounded-full bg-[#2d6a35] px-2.5 py-0.5 text-xs font-semibold text-white">
                          ✓ Corrected
                        </span>
                      </div>
                    ) : (
                      <CorrectionInput
                        problemId={problem.id}
                        sessionId={typedSession.id}
                        correctAnswer={problem.correct_answer}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/worksheet?student=${studentId}`}
            className="flex-1 rounded-xl bg-[#2d6a35] px-6 py-4 text-center text-base font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Try Again
          </Link>
          <Link
            href={`/play?student=${studentId}`}
            className="flex-1 rounded-xl border-2 border-[#bae0bd] bg-white px-6 py-4 text-center text-base font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            Back to Play
          </Link>
        </div>
      </main>
    </div>
  )
}
