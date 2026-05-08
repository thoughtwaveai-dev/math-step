import Link from 'next/link'
import type { WeakArea } from '@/lib/mistakeJournal'

interface Props {
  weakArea: WeakArea
  studentId: string
}

export default function TargetedPracticeCTA({ weakArea, studentId }: Props) {
  const params = new URLSearchParams({
    student: studentId,
    level: String(weakArea.levelNumber),
    sublevel: String(weakArea.sublevelNumber),
  })
  if (weakArea.problemType) params.set('type', weakArea.problemType)
  const href = `/practice/weak-spots?${params.toString()}`

  const headline = weakArea.problemType
    ? `${weakArea.label} could use a little practice`
    : 'Want to practise tricky questions?'
  const body = weakArea.problemType
    ? `Try 10 quick problems — it's totally optional and won't change your level.`
    : `Try 10 quick problems from ${weakArea.topic} — it's totally optional and won't change your level.`

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-[#f2faf3] px-5 py-4 space-y-2">
      <p className="text-sm font-semibold text-[#1a2e1c]">{headline}</p>
      <p className="text-xs text-[#4a6b4e]">{body}</p>
      <Link
        href={href}
        className="inline-block rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-sm font-semibold text-[#2d6a35] hover:bg-[#e1f4e3] transition-colors"
      >
        Try practice questions →
      </Link>
    </div>
  )
}
