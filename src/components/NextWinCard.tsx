import type { NextWin } from '@/lib/achievements'
import { ACHIEVEMENT_FAMILIES } from '@/lib/achievements'

interface Props {
  nextWin: NextWin
}

export default function NextWinCard({ nextWin }: Props) {
  if (nextWin.kind === 'maxed') {
    return (
      <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#4a6b4e]">Next win</p>
        <div className="mt-2 flex items-center gap-2">
          <span aria-hidden="true" className="text-lg leading-none">🏆</span>
          <p className="text-base font-bold text-[#1a2e1c]">All wins earned for now</p>
        </div>
        <p className="mt-2 text-sm text-[#2d6a35]">
          Amazing — keep practising for the next set!
        </p>
      </div>
    )
  }

  const family = ACHIEVEMENT_FAMILIES.find(f => f.id === nextWin.familyId)
  const unitSuffix = family?.unitSuffix ?? ''
  const completedWord = unitSuffix ? unitSuffix.trim() : 'completed'

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#4a6b4e]">
        {nextWin.friendlyTitle}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span aria-hidden="true" className="text-lg leading-none">{nextWin.emoji}</span>
        <p className="text-base font-bold text-[#1a2e1c]">{nextWin.label}</p>
      </div>
      <p className="mt-2 text-xs font-medium text-[#4a6b4e] tabular-nums">
        {nextWin.current.toLocaleString('en-NZ')} / {nextWin.target.toLocaleString('en-NZ')} {completedWord}
      </p>
      <div
        className="mt-2 h-2 w-full rounded-full bg-[#e1f4e3] overflow-hidden"
        role="progressbar"
        aria-valuenow={nextWin.progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[#4ade80]"
          style={{ width: `${nextWin.progressPct}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#2d6a35]">{nextWin.friendlyMessage}</p>
    </div>
  )
}
