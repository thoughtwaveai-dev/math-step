// Tiered achievements (v2). Like v1, nothing is persisted as individual unlock
// events — each render derives "earned tier" + "next-tier progress" from
// existing session/streak/progress data.

export type AchievementFamilyId =
  | 'worksheets'
  | 'perfect'
  | 'streak'
  | 'levels'
  | 'points'
  | 'selfcorrect'
  | 'speedy'

export interface AchievementFamilyDef {
  id: AchievementFamilyId
  emoji: string
  parentLabel: string
  unitSuffix?: string
  tiers: number[]
  formatTierBadge: (tier: number) => string
}

export const ACHIEVEMENT_FAMILIES: AchievementFamilyDef[] = [
  {
    id: 'worksheets',
    emoji: '📘',
    parentLabel: 'Worksheets completed',
    tiers: [1, 5, 10, 25, 50, 100],
    formatTierBadge: t => (t === 1 ? 'First Worksheet' : `${t} Worksheets`),
  },
  {
    id: 'perfect',
    emoji: '💯',
    parentLabel: 'Perfect scores',
    tiers: [1, 5, 10, 25],
    formatTierBadge: t => (t === 1 ? 'Perfect Score' : `${t} Perfect Scores`),
  },
  {
    id: 'streak',
    emoji: '🔥',
    parentLabel: 'Best streak',
    unitSuffix: ' days',
    tiers: [3, 5, 7, 14, 30],
    formatTierBadge: t => `${t}-Day Streak`,
  },
  {
    id: 'levels',
    emoji: '🚀',
    parentLabel: 'Levels mastered',
    tiers: [1, 3, 5, 10],
    formatTierBadge: t => (t === 1 ? 'Level Mastered' : `${t} Levels Mastered`),
  },
  {
    id: 'points',
    emoji: '⭐',
    parentLabel: 'Points earned',
    tiers: [100, 500, 1000, 2500],
    formatTierBadge: t => `${t.toLocaleString('en-NZ')} Points`,
  },
  {
    id: 'selfcorrect',
    emoji: '✏️',
    parentLabel: 'Self-correction wins',
    tiers: [1, 5, 10],
    formatTierBadge: t => (t === 1 ? 'Fixed a Mistake' : `${t} Mistakes Fixed`),
  },
  {
    id: 'speedy',
    emoji: '⚡',
    parentLabel: 'Speedy passes',
    tiers: [1, 5, 10],
    formatTierBadge: t => (t === 1 ? 'Speedy Pass' : `${t} Speedy Passes`),
  },
]

export interface FamilyProgress {
  family: AchievementFamilyDef
  value: number
  earnedTier: number | null
  nextTier: number | null
  isMaxed: boolean
}

export interface AchievementProgressInputs {
  totalSessions: number
  longestStreak: number
  totalPoints: number
  perfectCount: number
  speedyPassCount: number
  selfCorrectCount: number
  levelsMasteredCount: number
}

export function deriveAchievementProgress(input: AchievementProgressInputs): FamilyProgress[] {
  const valueByFamily: Record<AchievementFamilyId, number> = {
    worksheets: input.totalSessions,
    perfect: input.perfectCount,
    streak: input.longestStreak,
    levels: input.levelsMasteredCount,
    points: input.totalPoints,
    selfcorrect: input.selfCorrectCount,
    speedy: input.speedyPassCount,
  }

  return ACHIEVEMENT_FAMILIES.map(family => {
    const value = valueByFamily[family.id]
    let earnedTier: number | null = null
    let nextTier: number | null = null
    for (const tier of family.tiers) {
      if (value >= tier) earnedTier = tier
      else { nextTier = tier; break }
    }
    return {
      family,
      value,
      earnedTier,
      nextTier,
      isMaxed: nextTier === null,
    }
  })
}

// Earned highest-tier badges, used by the play "Your wins" strip.
export interface EarnedTierBadge {
  family: AchievementFamilyDef
  tier: number
}

export function earnedTierBadges(progress: FamilyProgress[]): EarnedTierBadge[] {
  return progress
    .filter(p => p.earnedTier !== null)
    .map(p => ({ family: p.family, tier: p.earnedTier as number }))
}

// Session milestones strip on the results page. Equality-based, fires only in
// the moment — see Milestone 51 notes for why streak milestones are skipped.
export interface SessionMilestoneInputs {
  totalSessionsAfter: number
  accuracy: number
  passed: boolean
  timeTakenSeconds: number | null
  speedTargetSeconds: number | null
  allMistakesCorrected: boolean
}

export interface MilestoneBadge {
  emoji: string
  title: string
}

const SESSION_TIER_THRESHOLDS = [1, 5, 10, 25, 50, 100]

export function detectSessionMilestones(input: SessionMilestoneInputs): MilestoneBadge[] {
  const out: MilestoneBadge[] = []

  if (SESSION_TIER_THRESHOLDS.includes(input.totalSessionsAfter)) {
    const t = input.totalSessionsAfter
    out.push({ emoji: '📘', title: t === 1 ? 'First Worksheet' : `${t} Worksheets` })
  }

  if (input.accuracy === 100) out.push({ emoji: '💯', title: 'Perfect Score' })

  if (
    input.passed &&
    input.speedTargetSeconds !== null &&
    input.timeTakenSeconds !== null &&
    input.timeTakenSeconds <= input.speedTargetSeconds
  ) {
    out.push({ emoji: '⚡', title: 'Beat the Time Target' })
  }

  if (input.allMistakesCorrected) {
    out.push({ emoji: '✏️', title: 'Fixed Every Mistake' })
  }

  return out
}
