import type { WeakArea } from '@/lib/mistakeJournal'

interface Props {
  weakAreas: WeakArea[]
  studentName: string
}

function signalLabel(area: WeakArea): string {
  if (area.signal === 'high') return 'Needs some practice'
  if (area.signal === 'medium') return 'Could use a little practice'
  return 'A bit of polish would help'
}

export default function MistakeJournalCard({ weakAreas, studentName }: Props) {
  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-[#1a2e1c]">Needs Practice</h2>
        <p className="text-xs text-[#4a6b4e]">Last 20 worksheets</p>
      </div>

      {weakAreas.length === 0 ? (
        <p className="text-sm text-[#4a6b4e]">
          {`No clear weak spots yet — keep going. ${studentName} hasn't made enough mistakes for us to spot a pattern.`}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {weakAreas.map((area) => (
              <li
                key={`${area.levelId}-${area.problemType ?? 'legacy'}`}
                className="rounded-lg border border-[#e8f5e9] bg-[#f7faf7] p-4"
              >
                <p className="text-sm font-semibold text-[#1a2e1c]">
                  {area.label}
                </p>
                <p className="mt-0.5 text-xs text-[#4a6b4e]">
                  {signalLabel(area)}
                </p>
                <p className="mt-1 text-xs text-[#4a6b4e] tabular-nums">
                  Recent accuracy: {area.accuracy}% over {area.totalAttempted} questions.
                  {' '}Missed {area.incorrectCount} question{area.incorrectCount === 1 ? '' : 's'} recently.
                </p>
                {area.recentExamples.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-xs italic text-[#4a6b4e]">Recent missed examples:</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {area.recentExamples.slice(0, 2).map((ex, i) => (
                        <li key={i} className="flex items-start gap-1 text-xs text-[#4a6b4e]">
                          <span aria-hidden="true">•</span>
                          <span className="font-mono">{ex.prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#4a6b4e]">
            Targeted practice is available in Student View and does not affect level progress.
          </p>
        </>
      )}
    </div>
  )
}
