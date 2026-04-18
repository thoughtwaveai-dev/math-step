import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateProblems } from '@/lib/math/generators'
import { shuffled } from '@/lib/math/generators/rand'
import { getLesson } from '@/lib/lessons'
import Image from 'next/image'
import WorksheetForm from './WorksheetForm'
import LessonCard from './LessonCard'
import WorksheetScratchpad from './WorksheetScratchpad'

// Curriculum-ordered list of levels that have generator support.
// Used to find eligible review levels relative to the student's current position.
const SUPPORTED_LEVEL_KEYS: [number, number][] = [
  [1, 1], [1, 2], [2, 1], [2, 2], [3, 1], [3, 2], [4, 1], [4, 2], [5, 1], [5, 2], [6, 1], [6, 2],
  [7, 1],
  [9, 1], [9, 2], [10, 1], [10, 2], [11, 1],
]

// Number of review problems to include in a mixed worksheet.
const REVIEW_PROBLEM_COUNT = 4

export default async function WorksheetPage({
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

  const problemCount = (level.problems_per_session as number) ?? 10

  // Show "Coming Soon" immediately for levels with no generator support.
  // Check this before interleaving so unsupported levels never accidentally
  // show a worksheet filled only with review problems.
  const currentLevelSupported = SUPPORTED_LEVEL_KEYS.some(([l, s]) => l === levelNumber && s === sublevelNumber)
  if (!currentLevelSupported) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7faf7]">
        <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
              <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
            </div>
            <a
              href={`/play?student=${student.id}`}
              className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              ← Play
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
              href={`/play?student=${student.id}`}
              className="mt-4 inline-block rounded-xl bg-[#2d6a35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
            >
              Back to Play
            </a>
          </div>
        </main>
      </div>
    )
  }

  // --- Interleaving: find eligible review levels ---
  // Only include levels where the student has actually demonstrated mastery
  // (consecutive_passes > 0 or last_result_passed = true). This ensures
  // placement-jumped students don't get review problems from unvisited levels.
  let reviewLevelKeys: [number, number][] = []

  const prevSupportedKeys = SUPPORTED_LEVEL_KEYS.filter(
    ([l, s]) => l < levelNumber || (l === levelNumber && s < sublevelNumber)
  )

  if (prevSupportedKeys.length > 0 && problemCount >= REVIEW_PROBLEM_COUNT + 4) {
    // Fetch level IDs for candidate supported levels
    const { data: candidateLevels } = await supabase
      .from('levels')
      .select('id, level_number, sublevel_number')
      .in('level_number', [...new Set(prevSupportedKeys.map(([l]) => l))])

    const levelIdMap = new Map(
      (candidateLevels ?? []).map(l => [`${l.level_number}/${l.sublevel_number}`, l.id as number])
    )

    const prevSupportedIds = prevSupportedKeys
      .map(([l, s]) => levelIdMap.get(`${l}/${s}`))
      .filter((id): id is number => id !== undefined)

    if (prevSupportedIds.length > 0) {
      const { data: progressRows } = await supabase
        .from('student_level_progress')
        .select('level_id, consecutive_passes, last_result_passed')
        .eq('student_id', student.id)
        .in('level_id', prevSupportedIds)

      const masteredIds = new Set(
        (progressRows ?? [])
          .filter(p => (p.consecutive_passes ?? 0) > 0 || p.last_result_passed)
          .map(p => p.level_id as number)
      )

      // Take the most recent 2 mastered supported levels before current
      reviewLevelKeys = prevSupportedKeys
        .filter(([l, s]) => {
          const id = levelIdMap.get(`${l}/${s}`)
          return id !== undefined && masteredIds.has(id)
        })
        .slice(-2)
    }
  }

  // Generate main + review problems, shuffle to interleave
  const mainCount = reviewLevelKeys.length > 0 ? problemCount - REVIEW_PROBLEM_COUNT : problemCount
  const mainProblems = generateProblems(levelNumber, sublevelNumber, mainCount)
    .map(p => ({ ...p, isReview: false as const }))

  const reviewProblems: Array<ReturnType<typeof generateProblems>[number] & { isReview: true }> = []
  if (reviewLevelKeys.length === 2) {
    const half = Math.floor(REVIEW_PROBLEM_COUNT / 2)
    reviewProblems.push(
      ...generateProblems(reviewLevelKeys[0][0], reviewLevelKeys[0][1], half)
        .map(p => ({ ...p, isReview: true as const })),
      ...generateProblems(reviewLevelKeys[1][0], reviewLevelKeys[1][1], REVIEW_PROBLEM_COUNT - half)
        .map(p => ({ ...p, isReview: true as const })),
    )
  } else if (reviewLevelKeys.length === 1) {
    reviewProblems.push(
      ...generateProblems(reviewLevelKeys[0][0], reviewLevelKeys[0][1], REVIEW_PROBLEM_COUNT)
        .map(p => ({ ...p, isReview: true as const })),
    )
  }

  // If review generator returned fewer than expected, top up with main-level problems
  const shortfall = REVIEW_PROBLEM_COUNT - reviewProblems.length
  const extraMain = shortfall > 0 && reviewLevelKeys.length > 0
    ? generateProblems(levelNumber, sublevelNumber, shortfall).map(p => ({ ...p, isReview: false as const }))
    : []

  const generatedProblems = shuffled([...mainProblems, ...reviewProblems, ...extraMain])

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
              href={`/play?student=${student.id}`}
              className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              ← Play
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
              href={`/play?student=${student.id}`}
              className="mt-4 inline-block rounded-xl bg-[#2d6a35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
            >
              Back to Play
            </a>
          </div>
        </main>
      </div>
    )
  }

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

  const persistedProblems = generatedProblems.map((p, i) => {
    const dbRow = insertedProblems.find(r => r.order_index === i)!
    return {
      id: dbRow.id as string,
      prompt: p.prompt,
      type: p.type,
      isReview: p.isReview,
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
            href={`/play?student=${student.id}`}
            className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            ← Play
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

        <WorksheetForm
          sessionId={session.id}
          problems={persistedProblems}
          reviewProblemIds={persistedProblems.filter(p => p.isReview).map(p => p.id)}
        />

        <WorksheetScratchpad />
      </main>
    </div>
  )
}
