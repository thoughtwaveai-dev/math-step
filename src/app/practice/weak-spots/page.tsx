import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { generateProblems } from '@/lib/math/generators'
import { SUPPORTED_LEVEL_KEYS } from '@/lib/levelKeys'
import PracticeForm from './PracticeForm'

const PRACTICE_PROBLEM_COUNT = 10

function parseLevelParam(value: string | undefined, fallback: number): number {
  const n = value ? parseInt(value, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default async function WeakSpotsPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; level?: string; sublevel?: string }>
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

  const levelNumber = parseLevelParam(sp.level, student.current_level as number)
  const sublevelNumber = parseLevelParam(sp.sublevel, student.current_sublevel as number)

  const supported = SUPPORTED_LEVEL_KEYS.some(
    ([l, s]) => l === levelNumber && s === sublevelNumber,
  )

  const { data: level } = await supabase
    .from('levels')
    .select('topic, description')
    .eq('level_number', levelNumber)
    .eq('sublevel_number', sublevelNumber)
    .maybeSingle()

  const topic = level?.topic ?? `Level ${levelNumber}.${sublevelNumber}`

  if (!supported) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7faf7]">
        <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
              <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
            </div>
            <Link
              href={`/play?student=${student.id}`}
              className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              ← Play
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-5 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900">Practice Coming Soon</h2>
            <p className="mt-2 text-sm text-amber-800">
              Targeted practice for Level {levelNumber}.{sublevelNumber} ({topic}) isn&apos;t available yet.
            </p>
            <Link
              href={`/play?student=${student.id}`}
              className="mt-4 inline-block rounded-xl bg-[#2d6a35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
            >
              Back to Play
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const generated = generateProblems(levelNumber, sublevelNumber, PRACTICE_PROBLEM_COUNT)

  if (generated.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <p className="text-sm text-[#4a6b4e]">Couldn&apos;t generate practice problems. Please try again.</p>
      </div>
    )
  }

  const problems = generated.map((p, i) => ({
    id: `practice-${i}`,
    prompt: p.prompt,
    answer: p.answer,
    type: p.type,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
          </div>
          <Link
            href={`/play?student=${student.id}`}
            className="rounded-lg border border-[#bae0bd] px-3.5 py-2 text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            ← Play
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-5">
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-[#e1f4e3] px-3 py-1 text-xs font-semibold text-[#2d6a35]">
            Practice · won&apos;t change your level
          </span>
          <h1 className="text-2xl font-bold text-[#1a2e1c]">{topic} Practice</h1>
          <p className="text-sm text-[#4a6b4e]">
            {student.name} · Level {levelNumber}.{sublevelNumber} · {problems.length} problems
          </p>
          <p className="text-xs text-[#4a6b4e]">
            These problems are just practice — your streak, points, and progress stay exactly the same.
          </p>
        </div>

        <PracticeForm problems={problems} studentId={student.id} />
      </main>
    </div>
  )
}
