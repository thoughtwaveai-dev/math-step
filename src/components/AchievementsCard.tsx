import { ACHIEVEMENTS, type AchievementId } from '@/lib/achievements'

interface Props {
  earnedIds: Set<AchievementId>
  variant: 'dashboard' | 'play'
  studentName?: string
}

export default function AchievementsCard({ earnedIds, variant, studentName }: Props) {
  const earnedCount = earnedIds.size
  const items = variant === 'play'
    ? ACHIEVEMENTS.filter(a => earnedIds.has(a.id))
    : ACHIEVEMENTS

  if (variant === 'play' && earnedCount === 0) {
    return (
      <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
        <h2 className="text-base font-semibold text-[#1a2e1c] mb-2">Your wins</h2>
        <p className="text-sm text-[#4a6b4e]">
          Finish a worksheet to earn your first badge — they show up right here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1a2e1c]">
          {variant === 'play' ? 'Your wins' : 'Milestones'}
        </h2>
        <span className="text-xs font-medium text-[#4a6b4e]">
          {earnedCount}/{ACHIEVEMENTS.length} earned
        </span>
      </div>

      {variant === 'dashboard' && earnedCount === 0 && (
        <p className="text-sm text-[#4a6b4e] mb-4">
          {studentName ?? 'Your student'}{' '}hasn&apos;t earned any milestones yet — the first finished worksheet unlocks the first badge.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {items.map(a => {
          const earned = earnedIds.has(a.id)
          return (
            <li
              key={a.id}
              className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center ${
                earned
                  ? 'border-[#bae0bd] bg-[#f2faf3]'
                  : 'border-[#e8f5e9] bg-[#f7faf7] opacity-55'
              }`}
              title={a.description}
            >
              <span className={`text-2xl leading-none ${earned ? '' : 'grayscale'}`} aria-hidden="true">
                {a.emoji}
              </span>
              <span className={`text-xs font-semibold ${earned ? 'text-[#1a2e1c]' : 'text-[#4a6b4e]'}`}>
                {a.title}
              </span>
              <span className="text-[10px] leading-tight text-[#4a6b4e]">
                {a.description}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
