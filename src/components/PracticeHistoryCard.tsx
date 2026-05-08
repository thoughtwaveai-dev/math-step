import { formatNzDateTime } from '@/lib/format'
import { parentLabelForType } from '@/lib/mistakeJournal'

export interface PracticeHistoryEntry {
  id: string
  completedAt: string
  levelNumber: number
  sublevelNumber: number
  topic: string
  problemType: string | null
  correctCount: number
  totalProblems: number
  accuracy: number
}

interface Props {
  entries: PracticeHistoryEntry[]
  thisWeekCount: number
  studentName: string
}

const VISIBLE_LIMIT = 5

function entryLabel(entry: PracticeHistoryEntry): string {
  if (entry.problemType) return parentLabelForType(entry.problemType)
  return `Level ${entry.levelNumber}.${entry.sublevelNumber} — ${entry.topic}`
}

export default function PracticeHistoryCard({ entries, thisWeekCount, studentName }: Props) {
  const visible = entries.slice(0, VISIBLE_LIMIT)

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-[#1a2e1c]">Practice history</h2>
        <p className="text-xs text-[#4a6b4e]">Targeted practice runs</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[#4a6b4e]">
          No practice sessions yet. Targeted practice from Needs Practice will appear here.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-[#4a6b4e]">
            {thisWeekCount === 0
              ? `${studentName} hasn't practised weak spots this week yet.`
              : thisWeekCount === 1
                ? `${studentName} practised weak spots 1 time this week.`
                : `${studentName} practised weak spots ${thisWeekCount} times this week.`}
          </p>
          <ul className="space-y-2">
            {visible.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-[#e8f5e9] bg-[#f7faf7] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1c] truncate">
                      {entryLabel(entry)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4a6b4e] tabular-nums">
                      {formatNzDateTime(entry.completedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e1f4e3] px-2.5 py-1 text-xs font-semibold text-[#2d6a35] tabular-nums">
                    {entry.correctCount} / {entry.totalProblems} ({entry.accuracy}%)
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {entries.length > VISIBLE_LIMIT && (
            <p className="mt-3 text-xs text-[#4a6b4e] italic">
              Showing latest {visible.length} of {entries.length} practice sessions.
            </p>
          )}
        </>
      )}
    </div>
  )
}
