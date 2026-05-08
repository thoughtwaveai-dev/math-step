import Link from 'next/link'
import type { WeakArea } from '@/lib/mistakeJournal'

interface Props {
  weakAreas: WeakArea[]
  studentId: string
  studentName: string
}

function signalLabel(area: WeakArea): string {
  if (area.signal === 'high') return 'Needs some practice'
  if (area.signal === 'medium') return 'Could use a little practice'
  return 'A bit of polish would help'
}

export default function MistakeJournalCard({ weakAreas, studentId, studentName }: Props) {
  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-[#1a2e1c]">Needs Practice</h2>
        <p className="text-xs text-[#4a6b4e]">Last 20 worksheets</p>
      </div>

      {weakAreas.length === 0 ? (
        <p className="text-sm text-[#4a6b4e]">
          No clear weak spots yet — keep practising. {studentName} hasn&apos;t made enough mistakes for us to spot a pattern.
        </p>
      ) : (
        <ul className="space-y-3">
          {weakAreas.map((area) => (
            <li
              key={area.levelId}
              className="rounded-lg border border-[#e8f5e9] bg-[#f7faf7] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1a2e1c]">
                    Level {area.levelNumber}.{area.sublevelNumber} — {area.topic}
                  </p>
                  <p className="mt-0.5 text-xs text-[#4a6b4e] tabular-nums">
                    {signalLabel(area)} · missed {area.incorrectCount} of {area.totalAttempted} ({area.accuracy}% accuracy)
                  </p>
                  {area.recentExamples.length > 0 && (
                    <p className="mt-1.5 text-xs italic text-[#4a6b4e]">
                      Recent:{' '}
                      {area.recentExamples.map((ex, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          <span className="font-mono not-italic">{ex.prompt}</span>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <Link
                  href={`/practice/weak-spots?student=${studentId}&level=${area.levelNumber}&sublevel=${area.sublevelNumber}`}
                  className="shrink-0 rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
                >
                  Practise
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
