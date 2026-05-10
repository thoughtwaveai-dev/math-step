import { earnedTierBadges, type FamilyProgress } from '@/lib/achievements'

interface Props {
  progress: FamilyProgress[]
  variant: 'dashboard' | 'play'
  studentName?: string
}

export default function AchievementsCard({ progress, variant, studentName }: Props) {
  if (variant === 'play') {
    const badges = earnedTierBadges(progress)
    if (badges.length === 0) {
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
        <h2 className="text-base font-semibold text-[#1a2e1c] mb-3">Your wins</h2>
        <ul className="flex flex-wrap gap-2">
          {badges.map(b => (
            <li
              key={b.family.id}
              className="inline-flex items-center gap-2 rounded-full border border-[#bae0bd] bg-[#f2faf3] px-3 py-1.5"
            >
              <span aria-hidden="true">{b.family.emoji}</span>
              <span className="text-xs font-semibold text-[#1a2e1c]">
                {b.family.formatTierBadge(b.tier)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Dashboard variant
  const inProgressCount = progress.filter(p => !p.isMaxed).length
  const earnedCount = progress.filter(p => p.earnedTier !== null).length
  const allEmpty = earnedCount === 0

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <h2 className="text-base font-semibold text-[#1a2e1c]">Milestones</h2>
        <span className="text-xs font-medium text-[#4a6b4e] tabular-nums">
          {inProgressCount > 0
            ? `${inProgressCount} of ${progress.length} badges in progress`
            : 'All badges earned 🏆'}
        </span>
      </div>

      {allEmpty && (
        <p className="text-sm text-[#4a6b4e] mb-4">
          {`${studentName ?? 'Your student'} hasn't earned any milestones yet — the first finished worksheet unlocks the first badge.`}
        </p>
      )}

      <ul className="space-y-3">
        {progress.map(p => {
          const target = p.nextTier ?? p.earnedTier ?? p.family.tiers[0]
          const pct = p.isMaxed ? 100 : Math.min(100, Math.round((p.value / target) * 100))
          const unit = p.family.unitSuffix ?? ''
          const rightLabel = p.isMaxed
            ? 'All badges earned 🏆'
            : p.earnedTier !== null
              ? `Latest badge earned: ${p.earnedTier}${unit} ✓`
              : 'No badges yet'
          const progressLabel = p.isMaxed
            ? `${p.value.toLocaleString('en-NZ')}${unit}`
            : `${p.value.toLocaleString('en-NZ')} / ${target.toLocaleString('en-NZ')}${unit} toward next badge`

          return (
            <li key={p.family.id} className="rounded-lg bg-[#f7faf7] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span aria-hidden="true" className="text-lg leading-none">{p.family.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#1a2e1c] truncate block">
                      {p.family.parentLabel}
                    </span>
                    {p.family.description && (
                      <span className="text-xs text-[#4a6b4e] truncate block">{p.family.description}</span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold tabular-nums ${
                    p.earnedTier !== null ? 'text-[#2d6a35]' : 'text-[#4a6b4e]'
                  }`}
                >
                  {rightLabel}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <span className="text-xs font-medium text-[#4a6b4e] tabular-nums">
                  {progressLabel}
                </span>
                <div className="h-2 w-full rounded-full bg-[#e1f4e3] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p.isMaxed ? 'bg-[#2d6a35]' : p.earnedTier !== null ? 'bg-[#2d6a35]' : 'bg-[#4ade80]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

