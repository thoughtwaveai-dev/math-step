// Pure streak arithmetic, extracted from `submitWorksheet` so it can be tested
// at a fixed instant. `worksheet.ts` is a 'use server' module and may only
// export async functions, so a sync helper cannot live there — the same reason
// `gradeAnswer` was pulled out into its own file.
//
// Day boundaries are NZ-local (Pacific/Auckland). Using UTC here rolled the day
// over at midday or 1pm NZ time, so an afternoon session was filed under
// tomorrow's date: that could award a streak day twice for one real day, or
// break a streak that was never actually missed.

import { nzDateKey, shiftDateKey } from './habit'

export interface ExistingStreak {
  current_streak: number | null
  longest_streak: number | null
  total_sessions: number | null
  total_points: number | null
  last_session_date: string | null
}

export interface StreakUpdate {
  current_streak: number
  longest_streak: number
  total_sessions: number
  total_points: number
  last_session_date: string
}

export const POINTS_PASS = 15
export const POINTS_ATTEMPT = 10

export function computeStreakUpdate(
  existing: ExistingStreak | null,
  passed: boolean,
  now: Date = new Date(),
): StreakUpdate {
  const today = nzDateKey(now)
  const lastDate = existing?.last_session_date ?? null
  const prevStreak = existing?.current_streak ?? 0

  let newStreak = prevStreak
  if (lastDate === null) {
    newStreak = 1
  } else if (lastDate === today) {
    // Already practised today: the streak holds, it does not grow again.
    newStreak = prevStreak
  } else {
    newStreak = lastDate === shiftDateKey(today, -1) ? prevStreak + 1 : 1
  }

  const prevLongest = existing?.longest_streak ?? 0
  const points = passed ? POINTS_PASS : POINTS_ATTEMPT

  return {
    current_streak: newStreak,
    longest_streak: Math.max(prevLongest, newStreak),
    total_sessions: (existing?.total_sessions ?? 0) + 1,
    total_points: (existing?.total_points ?? 0) + points,
    last_session_date: today,
  }
}
