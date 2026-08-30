// Streak date-handling gate. Every case here fails against the old UTC code
// (`new Date().toISOString().split('T')[0]`) and passes against nzDateKey.
//
// Run: npx tsx scripts/streak-date-gate.ts

import { computeStreakUpdate } from '../src/lib/streak'
import { nzDateKey, shiftDateKey } from '../src/lib/habit'

let checks = 0
let failures = 0

function eq(actual: unknown, expected: unknown, label: string) {
  checks++
  if (actual !== expected) {
    failures++
    console.log(`FAIL: ${label}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

// --- 1. The exact instant from the bug report -------------------------------
// 12:30 UTC on 30 Aug 2026. UTC says the 30th, Auckland (UTC+12) says the 31st.
const AFTERNOON_NZ = new Date('2026-08-30T12:30:00Z')

eq(AFTERNOON_NZ.toISOString().split('T')[0], '2026-08-30', 'sanity: UTC day is the 30th')
eq(nzDateKey(AFTERNOON_NZ), '2026-08-31', 'sanity: NZ day is the 31st')

{
  const r = computeStreakUpdate(
    { current_streak: 3, longest_streak: 5, total_sessions: 10, total_points: 100, last_session_date: '2026-08-30' },
    true,
    AFTERNOON_NZ,
  )
  // NZ-wise this is the next day after 30 Aug, so the streak grows to 4.
  eq(r.last_session_date, '2026-08-31', 'afternoon session is stamped with the NZ day')
  eq(r.current_streak, 4, 'afternoon session continues the streak (NZ day, not UTC day)')
}

// The same-day double-count the bug caused: practise on the NZ morning of the
// 31st (= 30th in UTC), then again that NZ afternoon.
{
  const morning = new Date('2026-08-30T20:00:00Z') // 8am NZ on the 31st
  eq(nzDateKey(morning), '2026-08-31', 'sanity: NZ morning of the 31st')
  const first = computeStreakUpdate(
    { current_streak: 3, longest_streak: 5, total_sessions: 10, total_points: 100, last_session_date: '2026-08-30' },
    true,
    morning,
  )
  eq(first.current_streak, 4, 'first session of the NZ day increments once')

  // Under the old UTC code the morning stamped "2026-08-30" and the afternoon
  // stamped "2026-08-31", so the streak incremented a second time for one day.
  const second = computeStreakUpdate(
    { current_streak: first.current_streak, longest_streak: first.longest_streak, total_sessions: first.total_sessions, total_points: first.total_points, last_session_date: first.last_session_date },
    true,
    new Date('2026-08-31T05:00:00Z'), // 5pm NZ, same NZ day
  )
  eq(second.current_streak, 4, 'second session that same NZ day does NOT increment again')
}

// --- 2. Second session on the same NZ day -----------------------------------
{
  const existing = { current_streak: 4, longest_streak: 9, total_sessions: 20, total_points: 250, last_session_date: '2026-08-31' }
  const r = computeStreakUpdate(existing, true, AFTERNOON_NZ)
  eq(r.current_streak, 4, 'same NZ day: streak unchanged')
  eq(r.longest_streak, 9, 'same NZ day: longest unchanged')
  eq(r.total_sessions, 21, 'same NZ day: total_sessions still counts')
  eq(r.total_points, 265, 'same NZ day: points still awarded (pass = 15)')
  eq(r.last_session_date, '2026-08-31', 'same NZ day: date key stays put')

  const failedRun = computeStreakUpdate(existing, false, AFTERNOON_NZ)
  eq(failedRun.total_points, 260, 'same NZ day: a failed run still awards 10')
  eq(failedRun.current_streak, 4, 'same NZ day: a failed run does not break the streak')
}

// --- 3. A one day gap resets the streak, longest is preserved ---------------
{
  const r = computeStreakUpdate(
    { current_streak: 7, longest_streak: 12, total_sessions: 40, total_points: 500, last_session_date: '2026-08-29' },
    true,
    AFTERNOON_NZ, // NZ day is the 31st, so the 30th was missed
  )
  eq(r.current_streak, 1, 'one day gap resets the streak to 1')
  eq(r.longest_streak, 12, 'one day gap preserves longest_streak')
  eq(r.total_sessions, 41, 'one day gap still counts the session')
}

// --- 4. Supporting cases ----------------------------------------------------
{
  const fresh = computeStreakUpdate(null, true, AFTERNOON_NZ)
  eq(fresh.current_streak, 1, 'brand new student starts at streak 1')
  eq(fresh.longest_streak, 1, 'brand new student longest is 1')
  eq(fresh.total_sessions, 1, 'brand new student first session counted')
  eq(fresh.total_points, 15, 'brand new student gets pass points')
  eq(fresh.last_session_date, '2026-08-31', 'brand new student stamped with NZ day')
}
{
  const r = computeStreakUpdate(
    { current_streak: 6, longest_streak: 6, total_sessions: 30, total_points: 400, last_session_date: '2026-08-30' },
    true,
    AFTERNOON_NZ,
  )
  eq(r.longest_streak, 7, 'longest_streak advances when the streak beats it')
}

// --- 5. Midnight edges and DST ---------------------------------------------
// NZ is UTC+12 (NZST) in August and UTC+13 (NZDT) in January.
{
  eq(nzDateKey(new Date('2026-08-30T11:59:00Z')), '2026-08-30', 'NZST: 11:59Z is still the 30th in NZ')
  eq(nzDateKey(new Date('2026-08-30T12:00:00Z')), '2026-08-31', 'NZST: 12:00Z is the 31st in NZ')
  eq(nzDateKey(new Date('2026-01-14T10:59:00Z')), '2026-01-14', 'NZDT: 10:59Z is still the 14th in NZ')
  eq(nzDateKey(new Date('2026-01-14T11:00:00Z')), '2026-01-15', 'NZDT: 11:00Z is the 15th in NZ')
}
// Late-evening NZ practice on consecutive real days must chain, not reset.
{
  const day1 = new Date('2026-08-30T09:00:00Z') // 9pm NZ, 30 Aug
  const day2 = new Date('2026-08-31T09:00:00Z') // 9pm NZ, 31 Aug
  eq(nzDateKey(day1), '2026-08-30', 'sanity: 9pm NZ on the 30th')
  eq(nzDateKey(day2), '2026-08-31', 'sanity: 9pm NZ on the 31st')
  const a = computeStreakUpdate(null, true, day1)
  const b = computeStreakUpdate({ ...a, last_session_date: a.last_session_date }, true, day2)
  eq(b.current_streak, 2, 'two consecutive NZ evenings chain to a 2 day streak')
}
// Month and year rollovers via shiftDateKey.
{
  eq(shiftDateKey('2026-09-01', -1), '2026-08-31', 'month rollover backwards')
  eq(shiftDateKey('2026-01-01', -1), '2025-12-31', 'year rollover backwards')
  const r = computeStreakUpdate(
    { current_streak: 2, longest_streak: 2, total_sessions: 5, total_points: 60, last_session_date: '2026-08-31' },
    true,
    new Date('2026-08-31T12:30:00Z'), // NZ day = 1 Sep
  )
  eq(r.last_session_date, '2026-09-01', 'month rollover: NZ day is 1 Sep')
  eq(r.current_streak, 3, 'month rollover: streak continues across the month boundary')
}

console.log(`\n${checks} checks, ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
