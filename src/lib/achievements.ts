// Derived-only achievements (v1). Nothing is persisted as individual unlock
// events — each render computes "earned" from existing session/streak/progress
// data. Adding more achievements should stay derivable from the same shape.

export type AchievementId =
  | 'first_worksheet'
  | 'five_worksheets'
  | 'ten_worksheets'
  | 'streak_3'
  | 'streak_5'
  | 'first_perfect'
  | 'level_mastered'
  | 'beat_time'

export interface AchievementDef {
  id: AchievementId
  emoji: string
  title: string
  description: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_worksheet', emoji: '🎯', title: 'First Worksheet', description: 'Finished your very first worksheet.' },
  { id: 'first_perfect',   emoji: '💯', title: 'Perfect Score',   description: 'Got every problem right on a worksheet.' },
  { id: 'beat_time',       emoji: '⚡', title: 'Speedy Pass',     description: 'Beat the time target on a passing worksheet.' },
  { id: 'streak_3',        emoji: '🔥', title: '3-Day Streak',    description: 'Practised three days in a row.' },
  { id: 'five_worksheets', emoji: '📘', title: '5 Worksheets',    description: 'Finished five worksheets.' },
  { id: 'streak_5',        emoji: '🔥', title: '5-Day Streak',    description: 'Practised five days in a row.' },
  { id: 'ten_worksheets',  emoji: '📚', title: '10 Worksheets',   description: 'Finished ten worksheets.' },
  { id: 'level_mastered',  emoji: '🚀', title: 'Level Mastered',  description: 'Mastered enough sessions to advance a level.' },
]

export interface AchievementInputs {
  totalSessions: number
  longestStreak: number
  hasPerfectSession: boolean
  // True when the student has advanced past 1.1 AND has at least one passing
  // session. Guards against the common case where a parent placement-jumps a
  // brand-new student to a higher level without any practice. Edge case not
  // covered: a placement-jump followed by a single pass at the new level
  // still satisfies the gate. Acceptable for v1 since the brief groups
  // "mastered / advanced" together.
  hasMasteredLevel: boolean
  recentSessions: Array<{
    passed: boolean | null
    time_taken_seconds: number | null
    level_id: number
  }>
  levelSpeedTargets: Map<number, number | null>
}

export function deriveEarnedAchievements(input: AchievementInputs): Set<AchievementId> {
  const earned = new Set<AchievementId>()

  if (input.totalSessions >= 1) earned.add('first_worksheet')
  if (input.totalSessions >= 5) earned.add('five_worksheets')
  if (input.totalSessions >= 10) earned.add('ten_worksheets')
  if (input.longestStreak >= 3) earned.add('streak_3')
  if (input.longestStreak >= 5) earned.add('streak_5')
  if (input.hasPerfectSession) earned.add('first_perfect')
  if (input.hasMasteredLevel) earned.add('level_mastered')

  // Beat-the-time check uses recent sessions only (v1 limitation).
  for (const s of input.recentSessions) {
    if (!s.passed) continue
    const target = input.levelSpeedTargets.get(s.level_id)
    if (target && s.time_taken_seconds !== null && s.time_taken_seconds <= target) {
      earned.add('beat_time')
      break
    }
  }

  return earned
}

// Milestone strip on the results page. Returns small badges that this
// just-completed session caused. Does NOT include level-up (already shown
// via the "Level Up!" banner) — only additive ones. The 100%/perfect badge
// here is intentional: it complements the existing celebration effect.
//
// "Fires only in the moment": both the worksheet-count and streak-style
// thresholds are equality checks against current_streak / total_sessions,
// which reflect "now", not the moment the session was completed. Revisiting
// session #1's results page once total_sessions has grown to 30 will not
// re-show "First Worksheet". This is intentional — the strip celebrates the
// hit, not the historical record. Streak milestones are skipped entirely
// here for the same reason (current_streak can drift further from the
// session's true streak than total_sessions does).
export interface SessionMilestoneInputs {
  totalSessionsAfter: number      // streaks.total_sessions after this session
  accuracy: number                // 0-100
  passed: boolean
  timeTakenSeconds: number | null
  speedTargetSeconds: number | null
  allMistakesCorrected: boolean   // every is_correct=false also has self_corrected=true
}

export interface MilestoneBadge {
  emoji: string
  title: string
}

export function detectSessionMilestones(input: SessionMilestoneInputs): MilestoneBadge[] {
  const out: MilestoneBadge[] = []

  if (input.totalSessionsAfter === 1) out.push({ emoji: '🎯', title: 'First Worksheet' })
  if (input.totalSessionsAfter === 5) out.push({ emoji: '📘', title: '5 Worksheets' })
  if (input.totalSessionsAfter === 10) out.push({ emoji: '📚', title: '10 Worksheets' })

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
