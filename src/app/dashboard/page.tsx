import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'

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
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900">MathStep</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        </div>

        {/* Student progress card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-zinc-900">{student.name}</h2>

          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Level</dt>
              <dd className="mt-1 text-2xl font-bold text-zinc-900">{student.current_level}</dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sublevel</dt>
              <dd className="mt-1 text-2xl font-bold text-zinc-900">{student.current_sublevel}</dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Streak</dt>
              <dd className="mt-1 text-2xl font-bold text-zinc-900">{streak}</dd>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Points</dt>
              <dd className="mt-1 text-2xl font-bold text-zinc-900">{totalPoints}</dd>
            </div>
          </dl>
        </div>

        {/* Start worksheet */}
        <a
          href="/worksheet"
          className="block w-full rounded-xl bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Start Today&apos;s Worksheet
        </a>

        {/* Last session summary */}
        {lastSession && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Last Session</h2>
            <div className="mt-4 flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  lastSession.passed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {lastSession.passed ? '✓ Passed' : '✗ Not passed'}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score</dt>
                <dd className="mt-1 text-lg font-semibold text-zinc-900">
                  {lastSession.correct_count}/{lastSession.total_problems}
                </dd>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Accuracy</dt>
                <dd className="mt-1 text-lg font-semibold text-zinc-900">
                  {Number(lastSession.accuracy)}%
                </dd>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Time</dt>
                <dd className="mt-1 text-lg font-semibold text-zinc-900">
                  {formatSpeed(lastSession.time_taken_seconds ?? 0)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Current focus card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Current Focus</h2>

          {level ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-2xl font-bold text-zinc-900">{level.topic}</p>
                <p className="mt-1 text-sm text-zinc-500">{level.description}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Speed target</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-900">
                    {formatSpeed(level.speed_target_seconds)}
                  </dd>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Accuracy</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-900">{level.accuracy_threshold}%</dd>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Problems/session</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-900">{level.problems_per_session}</dd>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mastery progress</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-900">
                    {consecutivePasses}/{level.consecutive_passes_required}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              No level data found for Level {student.current_level}, Sublevel {student.current_sublevel}.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
