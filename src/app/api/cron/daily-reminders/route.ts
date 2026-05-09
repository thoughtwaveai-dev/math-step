// Daily Reminder Email — Vercel Cron route handler.
// Schedule: vercel.json runs this at 03:00 UTC = 4:00 pm NZDT / 3:00 pm NZST.
// Auth: requires `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sets it).

import { createServiceRoleClient } from '@/lib/supabase/serviceRole'
import { sendDailyReminder } from '@/lib/email/resend'
import { buildDailyReminder, type PendingStudent } from '@/lib/email/templates/dailyReminder'
import { createUnsubscribeToken } from '@/lib/reminderToken'
import { getNzWeekRange, nzDateKey, shiftDateKey } from '@/lib/habit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { todayKey, mondayKey } = getNzWeekRange()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  // Pull every parent currently opted in. v1 user counts are tiny, so filter
  // dedup in JS to avoid PostgREST `or(...)` quoting fragility on date values.
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, email, name, last_reminder_sent_date')
    .eq('reminders_enabled', true)

  if (profilesErr) {
    return Response.json({ error: profilesErr.message }, { status: 500 })
  }

  const pendingProfiles = (profiles ?? []).filter(p => p.last_reminder_sent_date !== todayKey)

  // Levels are public + small — fetch once per cron run, key by (level, sublevel).
  const { data: allLevels } = await supabase
    .from('levels')
    .select('level_number, sublevel_number, topic')
  const levelTopicMap = new Map<string, string>()
  for (const l of allLevels ?? []) {
    levelTopicMap.set(`${l.level_number}.${l.sublevel_number}`, l.topic)
  }

  let sent = 0
  let skipped = 0
  let errors = 0
  const errorDetails: { parentId: string; reason: string }[] = []

  for (const profile of pendingProfiles) {
    if (!profile.email) {
      skipped++
      continue
    }

    const { data: students } = await supabase
      .from('students')
      .select('id, name, current_level, current_sublevel')
      .eq('parent_id', profile.id)
      .order('created_at', { ascending: true })

    if (!students || students.length === 0) {
      skipped++
      continue
    }
    const studentIds = students.map(s => s.id)

    const { data: streakRows } = await supabase
      .from('streaks')
      .select('student_id, current_streak')
      .in('student_id', studentIds)
    const streakByStudent = new Map<string, number>()
    for (const row of streakRows ?? []) {
      streakByStudent.set(row.student_id, row.current_streak ?? 0)
    }

    // 8-day UTC window guarantees we cover the full NZ Mon-Sun span regardless
    // of UTC offset / DST. Filtering to NZ Mon-Sun is done in JS via nzDateKey.
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('student_id, completed_at')
      .in('student_id', studentIds)
      .not('completed_at', 'is', null)
      .gte('completed_at', eightDaysAgo)

    const sessionsByStudent = new Map<string, Set<string>>()
    for (const s of students) sessionsByStudent.set(s.id, new Set<string>())
    for (const sess of recentSessions ?? []) {
      if (!sess.completed_at) continue
      sessionsByStudent.get(sess.student_id)?.add(nzDateKey(sess.completed_at))
    }

    const pending: PendingStudent[] = []
    for (const stu of students) {
      const days = sessionsByStudent.get(stu.id) ?? new Set<string>()
      if (days.has(todayKey)) continue
      let weekCount = 0
      let cursor = mondayKey
      for (let i = 0; i < 7; i++) {
        if (days.has(cursor)) weekCount++
        cursor = shiftDateKey(cursor, 1)
      }
      const topic = levelTopicMap.get(`${stu.current_level}.${stu.current_sublevel}`) ?? null
      pending.push({
        name: stu.name,
        currentStreak: streakByStudent.get(stu.id) ?? 0,
        daysPractisedThisWeek: weekCount,
        currentLevel: stu.current_level,
        currentSublevel: stu.current_sublevel,
        currentTopic: topic,
      })
    }

    if (pending.length === 0) {
      // Every student already practised today — no email, no dedup write.
      // Tomorrow's todayKey will differ, so this row stays eligible.
      skipped++
      continue
    }

    const unsubToken = createUnsubscribeToken(profile.id)
    const unsubscribeUrl = `${appUrl}/account/reminders/unsubscribe?token=${encodeURIComponent(unsubToken)}`
    const email = buildDailyReminder({
      parentName: profile.name ?? null,
      pendingStudents: pending,
      appUrl,
      unsubscribeUrl,
    })

    const result = await sendDailyReminder({
      to: profile.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    if (!result.ok) {
      errors++
      errorDetails.push({ parentId: profile.id, reason: result.error })
      continue
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ last_reminder_sent_date: todayKey })
      .eq('id', profile.id)

    if (updErr) {
      // Email went out but the timestamp didn't persist. Count as error so
      // we surface it in logs; do NOT increment `sent` since dedup may now
      // misfire on a same-day retry.
      errors++
      errorDetails.push({ parentId: profile.id, reason: `dedup write failed: ${updErr.message}` })
      continue
    }

    sent++
  }

  return Response.json({
    todayKey,
    candidates: pendingProfiles.length,
    sent,
    skipped,
    errors,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
  })
}
