import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateProblems } from '@/lib/math/generators'
import { getLesson } from '@/lib/lessons'
import Image from 'next/image'
import WorksheetForm from './WorksheetForm'
import LessonCard from './LessonCard'
import WorksheetScratchpad from './WorksheetScratchpad'

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
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <p className="text-sm text-[#4a6b4e]">Level data not found. Please contact support.</p>
      </div>
    )
  }

  // Generate problems in memory — count driven by curriculum metadata
  const problemCount = (level.problems_per_session as number) ?? 10
  const generatedProblems = generateProblems(levelNumber, sublevelNumber, problemCount)

  // If no generator exists for this level, show a safe fallback without creating a session
  if (generatedProblems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7faf7]">
        <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
              <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
            </div>
            <a
              href="/dashboard"
              className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              ← Dashboard
            </a>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-5 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900">Coming Soon</h2>
            <p className="mt-2 text-sm text-amber-800">
              Worksheets for Level {levelNumber}.{sublevelNumber} ({level.topic}) are not available yet.
              Check back soon!
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-block rounded-xl bg-[#2d6a35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <p className="text-sm text-[#4a6b4e]">Failed to start session. Please try again.</p>
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <p className="text-sm text-[#4a6b4e]">Failed to load problems. Please try again.</p>
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
  const lesson = getLesson(levelNumber, sublevelNumber)

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
          </div>
          <a
            href="/dashboard"
            className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1c]">{topic} Worksheet</h1>
          <p className="mt-0.5 text-sm text-[#4a6b4e]">
            {student.name} · Level {levelNumber}.{sublevelNumber}
          </p>
        </div>

        {lesson && <LessonCard lesson={lesson} />}

        <WorksheetForm sessionId={session.id} problems={persistedProblems} />

        <WorksheetScratchpad />
      </main>
    </div>
  )
}
