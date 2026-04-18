import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import Image from 'next/image'
import SetLevelForm from './SetLevelForm'
import { formatSpeed } from '@/lib/format'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DashboardPage({
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

  const { data: allLevels } = await supabase
    .from('levels')
    .select('id, level_number, sublevel_number, topic, description')
    .order('level_number', { ascending: true })
    .order('sublevel_number', { ascending: true })

  const levelMap = new Map(allLevels?.map(l => [l.id, l]) ?? [])

  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('id, completed_at, correct_count, total_problems, accuracy, time_taken_seconds, passed, level_id')
    .eq('student_id', student.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

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
          <h1 className="text-2xl font-bold text-[#1a2e1c]">{student.name}&apos;s Overview</h1>
          <p className="mt-0.5 text-sm text-[#4a6b4e]">{user.email}</p>
        </div>

        {/* Student switcher — shown when more than one student */}
        {students.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {students.map(s => (
              <a
                key={s.id}
                href={`/dashboard?student=${s.id}`}
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
            <p className="mt-1 text-3xl font-bold text-[#2d6a35]">{streak}</p>
          </div>
          <div className="rounded-xl border border-[#bae0bd] bg-white p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Points</p>
            <p className="mt-1 text-3xl font-bold text-[#2d6a35]">{totalPoints}</p>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={`/play?student=${student.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#bae0bd] bg-white px-6 py-4 text-base font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors shadow-sm"
          >
            Open Student View
          </a>
          <a
            href="/onboarding"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#bae0bd] bg-white px-5 py-4 text-sm font-semibold text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors shadow-sm sm:w-auto"
          >
            + Add Student
          </a>
        </div>

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

        {/* Recent Worksheets */}
        <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
          <h2 className="text-base font-semibold text-[#1a2e1c] mb-4">Recent Worksheets</h2>

          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.map((s) => {
                const lvl = levelMap.get(s.level_id)
                return (
                  <a
                    key={s.id}
                    href={`/worksheet/results/${s.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e8f5e9] bg-[#f7faf7] px-4 py-3 hover:bg-[#f2faf3] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a2e1c] truncate">
                        {lvl ? `Level ${lvl.level_number}.${lvl.sublevel_number} — ${lvl.topic}` : `Level ID ${s.level_id}`}
                      </p>
                      <p className="text-xs text-[#4a6b4e] mt-0.5">
                        {s.completed_at ? formatDate(s.completed_at) : '—'}
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
                  </a>
                )
              })}
            </div>
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
          <div className="px-5 pb-5 space-y-4">
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
              <a
                href={`/placement?student=${student.id}`}
                className="inline-block rounded-lg border border-[#bae0bd] bg-[#f7faf7] px-4 py-2.5 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
              >
                Run Placement Diagnostic →
              </a>
            </div>
          </div>
        </details>

        {/* Footer */}
        <div className="border-t border-[#bae0bd] pt-6 pb-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4a6b4e]">
          <span>MathStep · Beta</span>
          <div className="flex flex-wrap gap-4">
            <a href="/privacy" className="hover:text-[#2d6a35] hover:underline">Privacy</a>
            <a href="/terms" className="hover:text-[#2d6a35] hover:underline">Terms</a>
            <a href="/disclaimer" className="hover:text-[#2d6a35] hover:underline">Disclaimer</a>
            <a href="/feedback" className="font-medium text-[#2d6a35] hover:underline">Send feedback</a>
          </div>
        </div>
      </main>
    </div>
  )
}
