import type { HabitStatus } from '@/lib/habit'

interface Props {
  status: HabitStatus
  variant: 'play' | 'dashboard'
  studentName?: string
}

export default function HabitCard({ status, variant, studentName }: Props) {
  if (variant === 'play') return <PlayVariant status={status} />
  return <DashboardVariant status={status} studentName={studentName} />
}

function PlayVariant({ status }: { status: HabitStatus }) {
  const heading = status.todayDone ? "Today's practice done" : "Today's practice"
  const message = status.todayDone
    ? 'Nice work — you practised today!'
    : 'Ready for a short practice session?'
  const showStreakLine = status.todayDone && status.currentStreak >= 2

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#1a2e1c]">{heading}</h2>
        {status.todayDone && (
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e1f4e3] text-xs font-bold text-[#2d6a35]"
          >
            ✓
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-[#4a6b4e]">{message}</p>
      {showStreakLine && (
        <p className="mt-2 text-sm font-semibold text-[#2d6a35]">
          Nice — that&apos;s day {status.currentStreak}!
        </p>
      )}
      <div className="mt-4">
        <SevenDayRow weekDays={status.weekDays} />
      </div>
    </div>
  )
}

function DashboardVariant({
  status,
  studentName,
}: {
  status: HabitStatus
  studentName?: string
}) {
  const name = studentName ?? 'Your student'
  const todayLabel = status.todayDone ? 'Done ✓' : 'Not yet'
  const todayTone = status.todayDone ? 'text-[#2d6a35]' : 'text-[#4a6b4e]'

  let bodyCopy: string
  if (status.totalSessions === 0) {
    bodyCopy = `${name} hasn't started practising yet — the first short session is the easiest way to begin.`
  } else if (status.daysPractisedThisWeek === 0) {
    bodyCopy = `${name} hasn't practised yet this week — a short session helps them get back into rhythm.`
  } else if (status.daysPractisedThisWeek === 1) {
    bodyCopy = `${name} has practised 1 day this week.`
  } else {
    bodyCopy = `${name} has practised ${status.daysPractisedThisWeek} of 7 days this week.`
  }

  const todaySubline = status.todayDone
    ? 'Practice completed today.'
    : status.totalSessions === 0
      ? 'No sessions yet.'
      : 'No practice yet today.'

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <h2 className="text-base font-semibold text-[#1a2e1c]">Daily habit</h2>

      <p className="mt-2 text-sm text-[#4a6b4e]">{bodyCopy}</p>
      <p className="mt-1 text-xs text-[#4a6b4e]">{todaySubline}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Today</dt>
          <dd className={`mt-1 text-base font-bold ${todayTone}`}>{todayLabel}</dd>
        </div>
        <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Streak</dt>
          <dd className="mt-1 text-base font-bold text-[#1a2e1c] tabular-nums">
            {status.currentStreak} {status.currentStreak === 1 ? 'day' : 'days'}
          </dd>
        </div>
        <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Best</dt>
          <dd className="mt-1 text-base font-bold text-[#1a2e1c] tabular-nums">
            {status.longestStreak} {status.longestStreak === 1 ? 'day' : 'days'}
          </dd>
        </div>
        <div className="rounded-lg bg-[#f7faf7] p-3 text-center">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">This week</dt>
          <dd className="mt-1 text-base font-bold text-[#1a2e1c] tabular-nums">
            {status.daysPractisedThisWeek} / 7
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <SevenDayRow weekDays={status.weekDays} />
      </div>
    </div>
  )
}

function SevenDayRow({ weekDays }: { weekDays: HabitStatus['weekDays'] }) {
  return (
    <ul
      className="grid grid-cols-7 gap-1 sm:gap-2"
      aria-label="Practice this week"
    >
      {weekDays.map(day => {
        const baseTile =
          'flex h-8 w-full items-center justify-center rounded-md text-xs font-bold sm:h-10'
        let tone: string
        if (day.completed) {
          tone = 'bg-[#4ade80] text-white'
        } else if (day.isFuture) {
          tone = 'bg-white border border-dashed border-[#bae0bd] text-[#bae0bd]'
        } else {
          tone = 'bg-[#f7faf7] border border-[#bae0bd] text-[#4a6b4e]'
        }
        const todayRing = day.isToday ? 'ring-2 ring-[#2d6a35]' : ''
        const ariaLabel = day.completed
          ? `${day.shortLabel} — practised`
          : day.isFuture
            ? `${day.shortLabel} — upcoming`
            : `${day.shortLabel} — no practice`
        return (
          <li key={day.key} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#4a6b4e] sm:text-xs">
              <span className="sm:hidden">{day.letterLabel}</span>
              <span className="hidden sm:inline">{day.shortLabel}</span>
            </span>
            <span
              className={`${baseTile} ${tone} ${todayRing}`}
              aria-label={ariaLabel}
              title={day.key}
            >
              {day.completed ? '✓' : day.isToday ? '·' : ''}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
