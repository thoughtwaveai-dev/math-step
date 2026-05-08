// Daily Habit Loop v1 — pure derivation helpers.
// All date keys are NZ-local (Pacific/Auckland), not UTC, so "today" matches
// the family's clock even across DST and the international date line.

export const NZ_TIME_ZONE = 'Pacific/Auckland'

const NZ_DATE_PARTS = new Intl.DateTimeFormat('en-NZ', {
  timeZone: NZ_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const WEEKDAY_LABELS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const WEEKDAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

// Returns "YYYY-MM-DD" in NZ local time, regardless of the input's UTC offset.
export function nzDateKey(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input)
  const parts = NZ_DATE_PARTS.formatToParts(d)
  const year = parts.find(p => p.type === 'year')?.value ?? '0000'
  const month = parts.find(p => p.type === 'month')?.value ?? '01'
  const day = parts.find(p => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

// Shift a "YYYY-MM-DD" key by N calendar days. Pure string + UTC date math —
// never touches local wall-clock time, so DST transitions can't drift it.
export function shiftDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + deltaDays)
  return date.toISOString().slice(0, 10)
}

function weekdayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function weekdayShortLabel(key: string): string {
  return WEEKDAY_LABELS_LONG[weekdayIndex(key)]
}

export function weekdayLetterLabel(key: string): string {
  return WEEKDAY_LABELS_SHORT[weekdayIndex(key)]
}

export interface HabitDay {
  key: string
  shortLabel: string   // "Mon"
  letterLabel: string  // "M"
  isToday: boolean
  completed: boolean
}

export interface HabitStatus {
  todayDone: boolean
  practisedYesterday: boolean
  daysPractisedThisWeek: number
  last7: HabitDay[]
  totalSessions: number
  currentStreak: number
  longestStreak: number
}

export interface DeriveHabitInput {
  sessionCompletedAts: (string | null | undefined)[]
  totalSessions: number
  currentStreak: number
  longestStreak: number
  now?: Date
}

export function deriveHabitStatus(input: DeriveHabitInput): HabitStatus {
  const now = input.now ?? new Date()
  const todayKey = nzDateKey(now)

  const completedDays = new Set<string>()
  for (const iso of input.sessionCompletedAts) {
    if (!iso) continue
    completedDays.add(nzDateKey(iso))
  }

  const last7: HabitDay[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const key = shiftDateKey(todayKey, -offset)
    last7.push({
      key,
      shortLabel: weekdayShortLabel(key),
      letterLabel: weekdayLetterLabel(key),
      isToday: key === todayKey,
      completed: completedDays.has(key),
    })
  }

  const yesterdayKey = shiftDateKey(todayKey, -1)
  const daysPractisedThisWeek = last7.filter(d => d.completed).length

  return {
    todayDone: completedDays.has(todayKey),
    practisedYesterday: completedDays.has(yesterdayKey),
    daysPractisedThisWeek,
    last7,
    totalSessions: input.totalSessions,
    currentStreak: input.currentStreak,
    longestStreak: input.longestStreak,
  }
}
