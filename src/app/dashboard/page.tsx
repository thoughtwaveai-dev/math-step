import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import Image from 'next/image'
import SetLevelForm from './SetLevelForm'

function formatSpeed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('parent_id', user.id)
    .limit(1)

  if (!students || students.length === 0) redirect('/onboarding')

  const student = students[0]

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

  const { data: lastSession } = await supabase
    .from('sessions')
    .select('correct_count, total_problems, accuracy, time_taken_seconds, passed, completed_at')
    .eq('student_id', student.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch all curriculum levels for the placement selector
  const { data: allLevels } = await supabase
    .from('levels')
    .select('level_number, sublevel_number, topic, description')
    .order('level_number', { ascending: true })
    .order('sublevel_number', { ascending: true })

  // Fetch consecutive pass progress for current level
  const { data: levelProgress } = level
    ? await supabase
        .from('student_level_progress')
        .select('consecutive_passes')
        .eq('student_id', student.id)
        .eq('level_id', level.id)
        .maybeSingle()
    : { data: null }

  const consecutivePasses = levelProgress?.consecutive_passes ?? 0

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
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-[#bae0bd] bg-white px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-5">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1c]">Hello, {student.name}</h1>
          <p className="mt-0.5 text-sm text-[#4a6b4e]">{user.email}</p>
        </div>

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
            <p className="mt-1 text-3xl font-bold text-[#2d6a35]">{streak}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Points</p>
            <p className="mt-1 text-3xl font-bold text-[#2d6a35]">{totalPoints}</p>
          </div>
        </div>

        {/* Start worksheet CTA */}
        <a
          href="/worksheet"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#2d6a35] px-6 py-4 text-base font-semibold text-white hover:bg-[#1f4d26] transition-colors shadow-sm"
        >
          Start Today&apos;s Worksheet
        </a>

        {/* Last session */}
        {lastSession && (
          <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a2e1c]">Last Session</h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  lastSession.passed
                    ? 'bg-[#e1f4e3] text-[#2d6a35]'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {lastSession.passed ? '✓ Passed' : '✗ Not passed'}
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
                {/* Mastery pill */}
                <span className="shrink-0 rounded-full bg-[#e1f4e3] px-3 py-1 text-xs font-semibold text-[#2d6a35]">
                  {consecutivePasses}/{level.consecutive_passes_required} passes
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#f7faf7] p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Speed target</dt>
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

        {/* Set Level — parent control */}
        {allLevels && allLevels.length > 0 && (
          <SetLevelForm
            studentId={student.id}
            currentLevel={student.current_level}
            currentSublevel={student.current_sublevel}
            levels={allLevels}
          />
        )}
      </main>
    </div>
  )
}
