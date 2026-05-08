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
  isFuture: boolean
  completed: boolean
}

export interface HabitStatus {
  todayDone: boolean
  practisedYesterday: boolean
  daysPractisedThisWeek: number
  weekDays: HabitDay[]   // Monday → Sunday of the current NZ calendar week
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

  // Monday-first NZ calendar week: shift back so we land on Monday.
  // weekdayIndex returns 0=Sun ... 6=Sat; (i + 6) % 7 → days back to Monday.
  const todayDow = new Date(Date.UTC(
    Number(todayKey.slice(0, 4)),
    Number(todayKey.slice(5, 7)) - 1,
    Number(todayKey.slice(8, 10)),
  )).getUTCDay()
  const daysBackToMonday = (todayDow + 6) % 7
  const mondayKey = shiftDateKey(todayKey, -daysBackToMonday)

  const weekDays: HabitDay[] = []
  for (let offset = 0; offset < 7; offset++) {
    const key = shiftDateKey(mondayKey, offset)
    weekDays.push({
      key,
      shortLabel: weekdayShortLabel(key),
      letterLabel: weekdayLetterLabel(key),
      isToday: key === todayKey,
      isFuture: key > todayKey,
      completed: completedDays.has(key),
    })
  }

  const yesterdayKey = shiftDateKey(todayKey, -1)
  const daysPractisedThisWeek = weekDays.filter(d => d.completed).length

  return {
    todayDone: completedDays.has(todayKey),
    practisedYesterday: completedDays.has(yesterdayKey),
    daysPractisedThisWeek,
    weekDays,
    totalSessions: input.totalSessions,
    currentStreak: input.currentStreak,
    longestStreak: input.longestStreak,
  }
}
