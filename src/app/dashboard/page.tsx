import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { enforceParentMode } from '@/lib/parentMode'
import Image from 'next/image'
import Link from 'next/link'
import SetLevelForm from './SetLevelForm'
import PinSettings from './PinSettings'
import StudentModeCard from './StudentModeCard'
import RemindersToggle from './RemindersToggle'
import AchievementsCard from '@/components/AchievementsCard'
import MistakeJournalCard from '@/components/MistakeJournalCard'
import PracticeHistoryCard, { type PracticeHistoryEntry } from '@/components/PracticeHistoryCard'
import HabitCard from '@/components/HabitCard'
import { formatSpeed, formatNzDateTime } from '@/lib/format'
import { isStudentStuck } from '@/lib/stuckDetector'
import { deriveAchievementProgress } from '@/lib/achievements'
import { deriveHabitStatus, getNzWeekRange, nzDateKey } from '@/lib/habit'
import { deriveWeakAreas } from '@/lib/mistakeJournal'

const SESSION_FETCH_LIMIT = 500
const RECENT_VISIBLE_LIMIT = 25
const SCROLL_HINT_THRESHOLD = 7
const MISTAKE_JOURNAL_SESSION_WINDOW = 20
const PRACTICE_HISTORY_FETCH_LIMIT = 25

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; pin?: string }>
}) {
  await enforceParentMode('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true })

  if (!students || students.length === 0) redirect('/onboarding')

  const sp = await searchParams
  const selectedId = sp.student
  const showPinHint = sp.pin === 'needed'
  const student = (selectedId ? students.find(s => s.id === selectedId) : null) ?? students[0]

  const { data: profile } = await supabase
    .from('profiles')
    .select('parent_pin, reminders_enabled')
    .eq('id', user.id)
    .maybeSingle()
  const hasPin = Boolean(profile?.parent_pin)
  const remindersEnabled = Boolean(profile?.reminders_enabled)

  // Parallel: streaks/levels lookups + bounded full-history sessions + self-correction count + practice history
  const [
    { data: streakRow },
    { data: level },
    { data: allLevels },
    { data: allSessions },
    { count: selfCorrectCount },
    { data: practiceRows },
  ] = await Promise.all([
    supabase.from('streaks')
      .select('current_streak, longest_streak, total_sessions, total_points')
      .eq('student_id', student.id)
      .maybeSingle(),
    supabase.from('levels')
      .select('*')
      .eq('level_number', student.current_level)
      .eq('sublevel_number', student.current_sublevel)
      .maybeSingle(),
    supabase.from('levels')
      .select('id, level_number, sublevel_number, topic, description, speed_target_seconds')
      .order('level_number', { ascending: true })
      .order('sublevel_number', { ascending: true }),
    supabase.from('sessions')
      .select('id, completed_at, correct_count, total_problems, accuracy, time_taken_seconds, passed, level_id')
      .eq('student_id', student.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(SESSION_FETCH_LIMIT),
    supabase.from('problems')
      .select('id, sessions!inner(student_id)', { count: 'exact', head: true })
      .eq('self_corrected', true)
      .eq('sessions.student_id', student.id),
    supabase.from('practice_sessions')
      .select('id, level_id, problem_type, total_problems, correct_count, accuracy, completed_at')
      .eq('student_id', student.id)
      .order('completed_at', { ascending: false })
      .limit(PRACTICE_HISTORY_FETCH_LIMIT),
  ])

  const streak = streakRow?.current_streak ?? 0
  const longestStreak = streakRow?.longest_streak ?? 0
  const totalSessions = streakRow?.total_sessions ?? 0
  const totalPoints = streakRow?.total_points ?? 0
  const levelMap = new Map(allLevels?.map(l => [l.id, l]) ?? [])
  const speedTargetMap = new Map<number, number | null>(
    (allLevels ?? []).map(l => [l.id, l.speed_target_seconds ?? null])
  )

  const sessions = allSessions ?? []

  // Derive achievement counts from sessions + counts.
  const perfectCount = sessions.filter(s => Number(s.accuracy) === 100).length
  const passedLevelIds = new Set<number>()
  let speedyPassCount = 0
  for (const s of sessions) {
    if (s.passed) {
      passedLevelIds.add(s.level_id)
      const target = speedTargetMap.get(s.level_id)
      if (target && s.time_taken_seconds !== null && s.time_taken_seconds <= target) {
        speedyPassCount++
      }
    }
  }
  const levelsMasteredCount = passedLevelIds.size

  const achievementProgress = deriveAchievementProgress({
    totalSessions,
    longestStreak,
    totalPoints,
    perfectCount,
    speedyPassCount,
    selfCorrectCount: selfCorrectCount ?? 0,
    levelsMasteredCount,
  })

  const habitStatus = deriveHabitStatus({
    sessionCompletedAts: sessions.map(s => s.completed_at),
    totalSessions,
    currentStreak: streak,
    longestStreak,
  })

  // Recent Worksheets: first N, then trend uses first 10 of those.
  const recentSessions = sessions.slice(0, RECENT_VISIBLE_LIMIT)
  const sessions10 = sessions.slice(0, 10)

  // Parallel: stuck detection + level progress both need level.id
  const [
    { data: levelProgress },
    { data: recentLevelSessions },
  ] = await Promise.all([
    level
      ? supabase.from('student_level_progress')
          .select('consecutive_passes')
          .eq('student_id', student.id)
          .eq('level_id', level.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    level
      ? supabase.from('sessions')
          .select('passed')
          .eq('student_id', student.id)
          .eq('level_id', level.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
  ])

  const consecutivePasses = levelProgress?.consecutive_passes ?? 0
  const recentResults = (recentLevelSessions ?? []).map(s => s.passed ?? false)
  const isStuck = isStudentStuck(recentResults)

  // --- Mistake Journal: fetch problems from the recent N sessions ---
  const recentSessionsForMistakes = sessions.slice(0, MISTAKE_JOURNAL_SESSION_WINDOW)
  const recentSessionIds = recentSessionsForMistakes.map(s => s.id)
  let weakAreas: ReturnType<typeof deriveWeakAreas> = []
  if (recentSessionIds.length > 0) {
    const { data: recentProblems } = await supabase
      .from('problems')
      .select('problem_text, correct_answer, is_correct, session_id, order_index, problem_type')
      .in('session_id', recentSessionIds)
    if (recentProblems && recentProblems.length > 0) {
      weakAreas = deriveWeakAreas({
        problems: recentProblems,
        sessions: recentSessionsForMistakes.map(s => ({
          id: s.id,
          level_id: s.level_id,
          completed_at: s.completed_at,
        })),
        levels: (allLevels ?? []).map(l => ({
          id: l.id,
          level_number: l.level_number,
          sublevel_number: l.sublevel_number,
          topic: l.topic,
        })),
      })
    }
  }

  // --- Practice History: map rows + count this NZ-week (Mon-start, matches HabitCard) ---
  const { mondayKey, sundayKey } = getNzWeekRange()

  const practiceEntries: PracticeHistoryEntry[] = []
  let practiceThisWeekCount = 0
  for (const row of practiceRows ?? []) {
    if (!row.completed_at) continue
    const lvl = levelMap.get(row.level_id)
    if (!lvl) continue
    const dayKey = nzDateKey(row.completed_at)
    if (dayKey >= mondayKey && dayKey <= sundayKey) practiceThisWeekCount++
    practiceEntries.push({
      id: row.id,
      completedAt: row.completed_at,
      levelNumber: lvl.level_number,
      sublevelNumber: lvl.sublevel_number,
      topic: lvl.topic,
      problemType: row.problem_type,
      correctCount: row.correct_count,
      totalProblems: row.total_problems,
      accuracy: row.accuracy,
    })
  }

  // Analytics — computed from the last 10 sessions (sessions10, desc order)
  const hasSessions = sessions10.length > 0
  const avgAccuracy = hasSessions
    ? Math.round(sessions10.reduce((sum, s) => sum + Number(s.accuracy), 0) / sessions10.length)
    : null
  const passCount = sessions10.filter(s => s.passed).length
  const passRate = hasSessions ? Math.round((passCount / sessions10.length) * 100) : null
  const avgTimeSec = hasSessions
    ? Math.round(sessions10.reduce((sum, s) => sum + (s.time_taken_seconds ?? 0), 0) / sessions10.length)
    : null
  const lastAccuracy = hasSessions ? Math.round(Number(sessions10[0].accuracy)) : null
  const accuracyThreshold = level?.accuracy_threshold ?? null

  // Plain-English insight: compare newer half vs older half of accuracy
  let insight: string | null = null
  if (sessions10.length >= 4) {
    const accs = sessions10.map(s => Number(s.accuracy))
    const mid = Math.floor(accs.length / 2)
    const avgNewer = accs.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const avgOlder = accs.slice(mid).reduce((a, b) => a + b, 0) / (accs.length - mid)
    const diff = avgNewer - avgOlder
    if (diff > 5) insight = 'Accuracy is improving over recent sessions.'
    else if (diff < -5) insight = 'Accuracy has dipped over recent sessions.'
    else if (passRate !== null && passRate >= 80) insight = 'Pass rate is strong — keep up the consistency.'
    else if (passRate !== null && passRate <= 30) insight = `${student.name} is finding sessions challenging recently.`
    else insight = 'Accuracy has been steady recently.'
  }

  const showScrollHint = recentSessions.length > SCROLL_HINT_THRESHOLD

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      {/* Header */}
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/math-step-logo.png"
              alt="MathStep"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-[#1a2e1c]">MathStep</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/help"
              className="rounded-lg border border-[#bae0bd] bg-white px-3.5 py-2 text-sm font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
            >
              Help
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-[#bae0bd] bg-white px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-5">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1c]">{student.name}&apos;s Overview</h1>
          <p className="mt-0.5 text-sm text-[#4a6b4e]">{user.email}</p>
        </div>

        {showPinHint && !hasPin && (
          <div className="rounded-xl border border-[#bae0bd] bg-[#f2faf3] px-5 py-4">
            <p className="text-sm font-semibold text-[#1a2e1c]">Set up a PIN first</p>
            <p className="mt-1 text-sm text-[#4a6b4e]">
              Add a 4-digit PIN in the Parent PIN card below, then you can hand the device to your child in Student View.
            </p>
          </div>
        )}

        {/* Student switcher — shown when more than one student */}
        {students.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {students.map(s => (
              <Link
                key={s.id}
                href={`/dashboard?student=${s.id}`}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  s.id === student.id
                    ? 'bg-[#2d6a35] text-white'
                    : 'border border-[#bae0bd] bg-white text-[#2d6a35] hover:bg-[#f2faf3]'
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Level</p>
            <p className="mt-1 text-3xl font-bold text-[#1a2e1c] tabular-nums">{student.current_level}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Sublevel</p>
            <p className="mt-1 text-3xl font-bold text-[#1a2e1c] tabular-nums">{student.current_sublevel}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Streak</p>
            <p className="mt-1 text-3xl font-bold text-[#2d6a35] tabular-nums">{streak}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Points</p>
            <p className="mt-1 text-3xl font-bold text-[#2d6a35] tabular-nums">{totalPoints}</p>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/play?student=${student.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#bae0bd] bg-white px-6 py-4 text-base font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors shadow-sm"
          >
            Open Student View
          </Link>
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#bae0bd] bg-white px-5 py-4 text-sm font-semibold text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors shadow-sm sm:w-auto"
          >
            + Add Student
          </Link>
        </div>

        {/* Parent PIN / Student Mode card */}
        <StudentModeCard hasPin={hasPin} />

        {/* Current Focus */}
        <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
          <h2 className="text-base font-semibold text-[#1a2e1c] mb-4">Current Focus</h2>

          {level ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-[#1a2e1c]">{level.topic}</p>
                  <p className="mt-0.5 text-sm text-[#4a6b4e]">{level.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e1f4e3] px-3 py-1 text-xs font-semibold text-[#2d6a35]">
                  {consecutivePasses}/{level.consecutive_passes_required} passes
                </span>
              </div>

              {/* Stuck notice for parent */}
              {isStuck && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">
                    {student.name} is finding Level {student.current_level}.{student.current_sublevel} difficult
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Most of their recent sessions at this level haven&apos;t passed. The worksheet now surfaces a <span className="font-semibold">worked example</span> and an optional <span className="font-semibold">warm-up</span> with easier problems to rebuild confidence.
                    If they&apos;re still struggling after a few more sessions, it may help to review the worked example together or use Admin controls below to adjust their level.
                  </p>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#f7faf7] p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Time target</dt>
                  <dd className="mt-1 text-base font-semibold text-[#1a2e1c]">
                    {formatSpeed(level.speed_target_seconds)}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f7faf7] p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Accuracy</dt>
                  <dd className="mt-1 text-base font-semibold text-[#1a2e1c]">{level.accuracy_threshold}%</dd>
                </div>
                <div className="rounded-lg bg-[#f7faf7] p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Problems</dt>
                  <dd className="mt-1 text-base font-semibold text-[#1a2e1c]">{level.problems_per_session}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-sm text-[#4a6b4e]">
              No level data found for Level {student.current_level}.{student.current_sublevel}.
            </p>
          )}
        </div>

        {/* Progress at a Glance */}
        <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
          <h2 className="text-base font-semibold text-[#1a2e1c] mb-4">Progress at a Glance</h2>

          {hasSessions ? (
            <div className="space-y-4">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Accuracy</p>
                  <p className="mt-1 text-2xl font-bold text-[#1a2e1c] tabular-nums">{avgAccuracy}%</p>
                  <p className="text-xs text-[#4a6b4e]">last {sessions10.length} sessions</p>
                </div>
                <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Pass rate</p>
                  <p className="mt-1 text-2xl font-bold text-[#1a2e1c] tabular-nums">{passRate}%</p>
                  <p className="text-xs text-[#4a6b4e] tabular-nums">{passCount}/{sessions10.length} passed</p>
                </div>
                <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Time</p>
                  <p className="mt-1 text-2xl font-bold text-[#1a2e1c] tabular-nums">{formatSpeed(avgTimeSec ?? 0)}</p>
                  <p className="text-xs text-[#4a6b4e]">per session</p>
                </div>
                <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Sessions</p>
                  <p className="mt-1 text-2xl font-bold text-[#1a2e1c] tabular-nums">{totalSessions}</p>
                  <p className="text-xs text-[#4a6b4e] tabular-nums">best streak: {longestStreak}</p>
                </div>
              </div>

              {/* Recent accuracy trend */}
              <div>
                <div className="flex flex-col gap-0.5 mb-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                    Recent accuracy trend
                  </p>
                  {lastAccuracy !== null && avgAccuracy !== null && (
                    <p className="text-xs text-[#4a6b4e] tabular-nums">
                      Last session {lastAccuracy}% · average {avgAccuracy}%
                    </p>
                  )}
                </div>
                <div className="relative" style={{ height: '64px' }}>
                  {accuracyThreshold !== null && accuracyThreshold > 0 && accuracyThreshold <= 100 && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#bae0bd]"
                        style={{ bottom: `${accuracyThreshold}%` }}
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute right-0 rounded bg-white/80 px-1 text-[10px] font-medium text-[#4a6b4e] tabular-nums"
                        style={{ top: `calc(${100 - accuracyThreshold}% + 2px)` }}
                      >
                        {accuracyThreshold}% target
                      </span>
                    </>
                  )}
                  <div className="flex h-full items-end gap-1 sm:gap-1.5">
                    {[...sessions10].reverse().map((s) => {
                      const accNum = Number(s.accuracy)
                      const acc = Math.max(accNum, 6)
                      return (
                        <div
                          key={s.id}
                          style={{ height: `${acc}%` }}
                          className={`flex-1 rounded-t-sm ${s.passed ? 'bg-[#4ade80]' : 'bg-red-300'}`}
                          title={
                            (s.completed_at ? `${formatNzDateTime(s.completed_at)} · ` : '') +
                            `${accNum}% · ${s.passed ? 'Pass' : 'Fail'}`
                          }
                        />
                      )
                    })}
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-[#4a6b4e]">
                  <span>Oldest</span>
                  <span>Most recent</span>
                </div>
              </div>

              {/* Plain-English insight */}
              {insight && (
                <p className="text-sm text-[#4a6b4e] italic">{insight}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#4a6b4e]">No sessions yet — analytics will appear after the first worksheet is completed.</p>
          )}
        </div>

        {/* Daily habit — today's practice + 7-day rhythm */}
        <HabitCard status={habitStatus} variant="dashboard" studentName={student.name} />

        {/* Milestones */}
        <AchievementsCard progress={achievementProgress} variant="dashboard" studentName={student.name} />

        {/* Mistake Journal — needs practice */}
        <MistakeJournalCard
          weakAreas={weakAreas}
          studentId={student.id}
          studentName={student.name}
        />

        {/* Practice History — visibility into targeted practice (no progression effect) */}
        <PracticeHistoryCard
          entries={practiceEntries}
          thisWeekCount={practiceThisWeekCount}
          studentName={student.name}
        />

        {/* Recent Worksheets */}
        <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
          <h2 className="text-base font-semibold text-[#1a2e1c] mb-4">Recent Worksheets</h2>

          {recentSessions.length > 0 ? (
            <>
              <div
                className="space-y-2 max-h-[26rem] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#bae0bd]"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#bae0bd transparent' }}
              >
                {recentSessions.map((s) => {
                  const lvl = levelMap.get(s.level_id)
                  return (
                    <Link
                      key={s.id}
                      href={`/worksheet/results/${s.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#e8f5e9] bg-[#f7faf7] px-4 py-3 hover:bg-[#f2faf3] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a2e1c] truncate">
                          {lvl ? `Level ${lvl.level_number}.${lvl.sublevel_number} — ${lvl.topic}` : `Level ID ${s.level_id}`}
                        </p>
                        <p className="text-xs text-[#4a6b4e] mt-0.5 tabular-nums">
                          {s.completed_at ? formatNzDateTime(s.completed_at) : '—'}
                          {' · '}
                          {s.correct_count}/{s.total_problems}
                          {' · '}
                          {Number(s.accuracy)}%
                          {' · '}
                          {formatSpeed(s.time_taken_seconds ?? 0)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          s.passed ? 'bg-[#e1f4e3] text-[#2d6a35]' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {s.passed ? '✓' : '✗'}
                      </span>
                    </Link>
                  )
                })}
              </div>
              {showScrollHint && (
                <p className="mt-3 text-xs text-[#4a6b4e] italic">
                  Showing latest {recentSessions.length} worksheets — scroll to see more.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#4a6b4e]">No completed worksheets yet.</p>
          )}
        </div>

        {/* Admin controls — collapsed by default */}
        <details className="rounded-xl border border-[#bae0bd] bg-white">
          <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-[#4a6b4e] hover:text-[#1a2e1c] transition-colors list-none flex items-center justify-between">
            <span>Admin controls</span>
            <span className="text-xs text-[#4a6b4e]">▾</span>
          </summary>
          <div className="px-5 pb-5 space-y-5">
            <PinSettings hasPin={hasPin} />
            <RemindersToggle enabled={remindersEnabled} />
            {allLevels && allLevels.length > 0 && (
              <SetLevelForm
                studentId={student.id}
                currentLevel={student.current_level}
                currentSublevel={student.current_sublevel}
                levels={allLevels}
              />
            )}
            <div>
              <p className="text-xs text-[#4a6b4e] mb-2">
                Not sure about the placement? Run the short diagnostic quiz to get a recommendation.
              </p>
              <Link
                href={`/placement?student=${student.id}`}
                className="inline-block rounded-lg border border-[#bae0bd] bg-[#f7faf7] px-4 py-2.5 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
              >
                Run Placement Diagnostic →
              </Link>
            </div>
          </div>
        </details>

        {/* Footer */}
        <div className="border-t border-[#bae0bd] pt-6 pb-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4a6b4e]">
          <span>MathStep · Beta</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/help" className="hover:text-[#2d6a35] hover:underline">Help</Link>
            <Link href="/privacy" className="hover:text-[#2d6a35] hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-[#2d6a35] hover:underline">Terms</Link>
            <Link href="/disclaimer" className="hover:text-[#2d6a35] hover:underline">Disclaimer</Link>
            <Link href="/feedback" className="font-medium text-[#2d6a35] hover:underline">Send feedback</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
