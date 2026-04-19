import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { formatSpeed } from '@/lib/format'
import { isStudentStuck } from '@/lib/stuckDetector'

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>
}) {
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
  const student = (selectedId ? students.find(s => s.id === selectedId) : null) ?? students[0]

  const { data: streakRow } = await supabase
    .from('streaks')
    .select('current_streak, total_points')
    .eq('student_id', student.id)
    .maybeSingle()

  const streak = streakRow?.current_streak ?? 0
  const totalPoints = streakRow?.total_points ?? 0

  const { data: level } = await supabase
    .from('levels')
    .select('*')
    .eq('level_number', student.current_level)
    .eq('sublevel_number', student.current_sublevel)
    .maybeSingle()

  const { data: lastSession } = level
    ? await supabase
        .from('sessions')
        .select('correct_count, total_problems, accuracy, time_taken_seconds, passed, completed_at')
        .eq('student_id', student.id)
        .eq('level_id', level.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const { data: levelProgress } = level
    ? await supabase
        .from('student_level_progress')
        .select('consecutive_passes')
        .eq('student_id', student.id)
        .eq('level_id', level.id)
        .maybeSingle()
    : { data: null }

  const consecutivePasses = levelProgress?.consecutive_passes ?? 0

  // Stuck detection: last 5 sessions for this student at the current level
  const { data: recentLevelSessions } = level
    ? await supabase
        .from('sessions')
        .select('passed')
        .eq('student_id', student.id)
        .eq('level_id', level.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5)
    : { data: null }

  const recentResults = (recentLevelSessions ?? []).map(s => s.passed ?? false)
  const isStuck = isStudentStuck(recentResults)

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      {/* Header */}
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
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
          <a
            href={`/dashboard?student=${student.id}`}
            className="rounded-lg border border-[#bae0bd] bg-white px-3.5 py-2 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
          >
            Parent view
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-bold text-[#1a2e1c]">Hi, {student.name}!</h1>
          <p className="mt-1 text-sm text-[#4a6b4e]">Ready to practise some maths today?</p>
        </div>

        {/* Student switcher — shown when more than one student */}
        {students.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {students.map(s => (
              <a
                key={s.id}
                href={`/play?student=${s.id}`}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  s.id === student.id
                    ? 'bg-[#2d6a35] text-white'
                    : 'border border-[#bae0bd] bg-white text-[#2d6a35] hover:bg-[#f2faf3]'
                }`}
              >
                {s.name}
              </a>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Level</p>
            <p className="mt-1 text-3xl font-bold text-[#1a2e1c]">{student.current_level}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Sublevel</p>
            <p className="mt-1 text-3xl font-bold text-[#1a2e1c]">{student.current_sublevel}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Streak</p>
            <p className="mt-1 text-3xl font-bold text-[#2d6a35]">{streak} 🔥</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Points</p>
            <p className="mt-1 text-3xl font-bold text-[#2d6a35]">{totalPoints}</p>
          </div>
        </div>

        {/* Start worksheet CTA */}
        <a
          href={`/worksheet?student=${student.id}`}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#2d6a35] px-6 py-5 text-lg font-bold text-white hover:bg-[#1f4d26] transition-colors shadow-sm"
        >
          Start Today&apos;s Worksheet
        </a>

        {/* Support card when student is stuck */}
        {isStuck && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-amber-900">This one is taking a bit more practice — that&apos;s okay.</p>
            <p className="text-xs text-amber-800">
              On the worksheet you&apos;ll find a <span className="font-semibold">worked example</span> to walk through before you start,
              and an optional <span className="font-semibold">warm-up</span> with easier problems to build confidence first.
              Take your time with the example — then give the worksheet a go.
            </p>
          </div>
        )}

        {/* Current topic */}
        {level && (
          <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1a2e1c] mb-3">What you&apos;re working on</h2>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-[#1a2e1c]">{level.topic}</p>
                <p className="mt-0.5 text-sm text-[#4a6b4e]">{level.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#e1f4e3] px-3 py-1 text-xs font-semibold text-[#2d6a35]">
                {consecutivePasses}/{level.consecutive_passes_required} passes
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-[#e1f4e3]">
                <div
                  className="h-2 rounded-full bg-[#2d6a35] transition-all"
                  style={{
                    width: level.consecutive_passes_required > 0
                      ? `${Math.min(100, (consecutivePasses / level.consecutive_passes_required) * 100)}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-[#4a6b4e]">
                {consecutivePasses >= level.consecutive_passes_required
                  ? 'Mastered! Moving to next level.'
                  : `${level.consecutive_passes_required - consecutivePasses} more passing session${level.consecutive_passes_required - consecutivePasses === 1 ? '' : 's'} to advance`}
              </p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#f7faf7] p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Speed target</dt>
                <dd className="mt-1 text-base font-semibold text-[#1a2e1c]">{formatSpeed(level.speed_target_seconds)}</dd>
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
        )}

        {/* Last session summary */}
        {lastSession && (
          <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#1a2e1c]">Last session</h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  lastSession.passed
                    ? 'bg-[#e1f4e3] text-[#2d6a35]'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {lastSession.passed ? '✓ Passed' : '✗ Keep going!'}
              </span>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Score</dt>
                <dd className="mt-1 text-lg font-bold text-[#1a2e1c]">
                  {lastSession.correct_count}/{lastSession.total_problems}
                </dd>
              </div>
              <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Accuracy</dt>
                <dd className="mt-1 text-lg font-bold text-[#1a2e1c]">
                  {Number(lastSession.accuracy)}%
                </dd>
              </div>
              <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
                <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Time</dt>
                <dd className="mt-1 text-lg font-bold text-[#1a2e1c]">
                  {formatSpeed(lastSession.time_taken_seconds ?? 0)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </main>
    </div>
  )
}
