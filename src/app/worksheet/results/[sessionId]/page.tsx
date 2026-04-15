import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  searchParams: Promise<{ advanced?: string; nl?: string; ns?: string; nt?: string }>
}) {
  const { sessionId } = await params
  const sp = await searchParams
  const didAdvance = sp.advanced === '1'
  const newLevel = sp.nl ? parseInt(sp.nl, 10) : null
  const newSublevel = sp.ns ? parseInt(sp.ns, 10) : null
  const newTopic = sp.nt ?? null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch session + verify ownership via student's parent_id
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('parent_id', user.id)
    .limit(1)

  const studentId = students?.[0]?.id
  if (!studentId) redirect('/onboarding')

  const { data: session } = await supabase
    .from('sessions')
    .select('*, problems(*)')
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (!session) redirect('/dashboard')

  const typedSession = session as Session
  if (!typedSession.completed_at) redirect('/worksheet')

  // Fetch level progress for this session's level
  const { data: levelProgress } = await supabase
    .from('student_level_progress')
    .select('consecutive_passes')
    .eq('student_id', studentId)
    .eq('level_id', typedSession.level_id)
    .maybeSingle()

  // Fetch level metadata for passes required
  const { data: levelMeta } = await supabase
    .from('levels')
    .select('consecutive_passes_required, topic, level_number, sublevel_number')
    .eq('id', typedSession.level_id)
    .maybeSingle()

  const consecutivePasses = levelProgress?.consecutive_passes ?? 0
  const passesRequired = levelMeta?.consecutive_passes_required ?? null

  const problems = [...typedSession.problems].sort((a, b) => a.order_index - b.order_index)

  const correctCount = typedSession.correct_count ?? 0
  const totalProblems = typedSession.total_problems ?? problems.length
  const accuracy = typedSession.accuracy ? Number(typedSession.accuracy) : 0
  const passed = typedSession.passed ?? false

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900">MathStep</span>
          <a
            href="/dashboard"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Worksheet Results</h1>

        {/* Score summary */}
        <div
          className={`rounded-xl border p-6 ${
            passed ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'
          }`}
        >
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score</dt>
              <dd className="mt-1 text-3xl font-bold text-zinc-900">
                {correctCount}/{totalProblems}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Accuracy</dt>
              <dd className="mt-1 text-3xl font-bold text-zinc-900">{accuracy}%</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Time</dt>
              <dd className="mt-1 text-3xl font-bold text-zinc-900">
                {formatTime(typedSession.time_taken_seconds)}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                passed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {passed ? '✓ Passed' : '✗ Not passed'}
            </span>
          </div>
        </div>

        {/* Level advancement banner */}
        {didAdvance && newLevel !== null && newSublevel !== null && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-base font-semibold text-blue-900">Level Up!</p>
            <p className="mt-1 text-sm text-blue-700">
              Advanced to Level {newLevel}.{newSublevel}{newTopic ? ` — ${newTopic}` : ''}.
            </p>
          </div>
        )}

        {/* Consecutive pass progress for this level */}
        {!didAdvance && passesRequired !== null && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-700">
              Progress toward mastery:{' '}
              <span className="font-bold text-zinc-900">
                {consecutivePasses} / {passesRequired} passes
              </span>
            </p>
            {passed && (
              <p className="mt-1 text-xs text-zinc-500">
                {consecutivePasses >= passesRequired
                  ? 'Mastery reached!'
                  : `${passesRequired - consecutivePasses} more passing session${passesRequired - consecutivePasses === 1 ? '' : 's'} to advance.`}
              </p>
            )}
            {!passed && (
              <p className="mt-1 text-xs text-zinc-500">
                Consecutive passes reset. Keep practicing!
              </p>
            )}
          </div>
        )}

        {/* Problem review */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">Problem Review</h2>

          {problems.map((problem, index) => (
            <div
              key={problem.id}
              className={`rounded-xl border bg-white p-5 ${
                problem.is_correct ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    problem.is_correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {problem.is_correct ? '✓' : '✗'}
                </span>

                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-zinc-500">
                    Problem {index + 1}
                  </p>
                  <p className="text-base font-medium text-zinc-900">{problem.problem_text}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Your answer
                      </p>
                      <p
                        className={`mt-0.5 font-medium ${
                          problem.is_correct ? 'text-green-700' : 'text-red-600'
                        }`}
                      >
                        {problem.student_answer || (
                          <span className="italic text-zinc-400">no answer</span>
                        )}
                      </p>
                    </div>

                    {!problem.is_correct && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                          Correct answer
                        </p>
                        <p className="mt-0.5 font-medium text-green-700">
                          {problem.correct_answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <a
          href="/worksheet"
          className="block w-full rounded-xl bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Try Again
        </a>
      </main>
    </div>
  )
}
