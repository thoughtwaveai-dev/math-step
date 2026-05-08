import Link from 'next/link'
import type { WeakArea } from '@/lib/mistakeJournal'

interface Props {
  weakArea: WeakArea
  studentId: string
}

export default function TargetedPracticeCTA({ weakArea, studentId }: Props) {
  return (
    <div className="rounded-xl border border-[#bae0bd] bg-[#f2faf3] px-5 py-4 space-y-2">
      <p className="text-sm font-semibold text-[#1a2e1c]">Want to practise tricky questions?</p>
      <p className="text-xs text-[#4a6b4e]">
        Try 10 quick problems from{' '}
        <span className="font-medium text-[#1a2e1c]">{weakArea.topic}</span>{' '}
        — it&apos;s totally optional and won&apos;t change your level.
      </p>
      <Link
        href={`/practice/weak-spots?student=${studentId}&level=${weakArea.levelNumber}&sublevel=${weakArea.sublevelNumber}`}
        className="inline-block rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-sm font-semibold text-[#2d6a35] hover:bg-[#e1f4e3] transition-colors"
      >
        Try practice questions →
      </Link>
    </div>
  )
}
