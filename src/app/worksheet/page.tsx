import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateProblems } from '@/lib/math/generators'
import WorksheetForm from './WorksheetForm'

export default async function WorksheetPage() {
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
  const levelNumber = student.current_level as number
  const sublevelNumber = student.current_sublevel as number

  const { data: level } = await supabase
    .from('levels')
    .select('*')
    .eq('level_number', levelNumber)
    .eq('sublevel_number', sublevelNumber)
    .maybeSingle()

  if (!level) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Level data not found. Please contact support.</p>
      </div>
    )
  }

  // Generate problems in memory — count driven by curriculum metadata
  const problemCount = (level.problems_per_session as number) ?? 10
  const generatedProblems = generateProblems(levelNumber, sublevelNumber, problemCount)

  // If no generator exists for this level, show a safe fallback without creating a session
  if (generatedProblems.length === 0) {
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
        <main className="mx-auto w-full max-w-3xl px-6 py-10">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-900">Coming Soon</h2>
            <p className="mt-2 text-sm text-amber-800">
              Worksheets for Level {levelNumber}.{sublevelNumber} ({level.topic}) are not available yet.
              Check back soon!
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-block rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Back to Dashboard
            </a>
          </div>
        </main>
      </div>
    )
  }

  // Create a new session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      student_id: student.id,
      level_id: level.id,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Failed to start session. Please try again.</p>
      </div>
    )
  }

  // Persist problems to DB
  const problemRows = generatedProblems.map((p, i) => ({
    session_id: session.id,
    problem_text: p.prompt,
    correct_answer: p.answer,
    order_index: i,
  }))

  const { data: insertedProblems, error: problemsError } = await supabase
    .from('problems')
    .insert(problemRows)
    .select('id, order_index')

  if (problemsError || !insertedProblems) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Failed to load problems. Please try again.</p>
      </div>
    )
  }

  // Merge DB UUIDs with in-memory generator data (matched by order_index)
  const persistedProblems = generatedProblems.map((p, i) => {
    const dbRow = insertedProblems.find(r => r.order_index === i)!
    return {
      id: dbRow.id as string,
      prompt: p.prompt,
      type: p.type,
    }
  })

  const topic = level.topic ?? 'Math'

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
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900">{topic} Worksheet</h1>
          <p className="text-sm text-zinc-500">
            {student.name} · Level {levelNumber}.{sublevelNumber}
          </p>
        </div>

        <WorksheetForm sessionId={session.id} problems={persistedProblems} />
      </main>
    </div>
  )
}
