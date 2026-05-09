// Weekly Review Email — Vercel Cron route handler.
// Schedule: vercel.json runs this at 04:00 UTC Sunday = 5:00 pm NZDT / 4:00 pm NZST.
// Auth: requires `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sets it).

import { createServiceRoleClient } from '@/lib/supabase/serviceRole'
import { sendWeeklyReview } from '@/lib/email/resend'
import { buildWeeklyReview, type WeeklyStudentBlock } from '@/lib/email/templates/weeklyReview'
import { createWeeklyUnsubscribeToken } from '@/lib/reminderToken'
import { getNzWeekRange, nzDateKey, shiftDateKey, NZ_TIME_ZONE } from '@/lib/habit'
import {
  ACHIEVEMENT_FAMILIES,
  deriveAchievementProgress,
  type AchievementFamilyId,
} from '@/lib/achievements'
import { deriveWeakAreas } from '@/lib/mistakeJournal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SESSION_FETCH_LIMIT = 500
const MISTAKE_JOURNAL_SESSION_WINDOW = 20

interface SessionRow {
  id: string
  student_id: string
  completed_at: string | null
  correct_count: number
  total_problems: number
  accuracy: number
  time_taken_seconds: number | null
  passed: boolean
  level_id: number
}

interface LevelRow {
  id: number
  level_number: number
  sublevel_number: number
  topic: string
  speed_target_seconds: number | null
}

const NZ_DATE_LABEL = new Intl.DateTimeFormat('en-NZ', {
  timeZone: NZ_TIME_ZONE,
  day: 'numeric',
  month: 'short',
})

function dateLabelFromKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  // Anchor to NZ noon for that day so DST + month-name formatting are stable.
  const date = new Date(`${key}T12:00:00+12:00`)
  if (!Number.isNaN(date.getTime())) return NZ_DATE_LABEL.format(date)
  // Fallback that never throws.
  return `${d}/${m}/${y}`
}

function longestRun(dateKeys: Set<string>): number {
  if (dateKeys.size === 0) return 0
  const sorted = [...dateKeys].sort()
  let longest = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === shiftDateKey(sorted[i - 1], 1)) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}

interface SnapshotInput {
  sessions: SessionRow[]
  selfCorrectSessionIds: string[]   // problems.self_corrected=true → these session_ids (with multiplicity)
  speedTargetByLevel: Map<number, number | null>
}

function snapshot(input: SnapshotInput, cutoffKey: string | null) {
  const inWindow = cutoffKey === null
    ? input.sessions
    : input.sessions.filter(s => s.completed_at && nzDateKey(s.completed_at) <= cutoffKey)

  const inWindowIds = new Set(inWindow.map(s => s.id))

  let totalPoints = 0
  let perfectCount = 0
  let speedyPassCount = 0
  const passedLevelIds = new Set<number>()
  const dateKeys = new Set<string>()

  for (const s of inWindow) {
    totalPoints += s.passed ? 15 : 10
    if (Number(s.accuracy) === 100) perfectCount++
    if (s.passed) {
      passedLevelIds.add(s.level_id)
      const target = input.speedTargetByLevel.get(s.level_id)
      if (target && s.time_taken_seconds !== null && s.time_taken_seconds <= target) {
        speedyPassCount++
      }
    }
    if (s.completed_at) dateKeys.add(nzDateKey(s.completed_at))
  }

  let selfCorrectCount = 0
  for (const sid of input.selfCorrectSessionIds) {
    if (inWindowIds.has(sid)) selfCorrectCount++
  }

  return deriveAchievementProgress({
    totalSessions: inWindow.length,
    longestStreak: longestRun(dateKeys),
    totalPoints,
    perfectCount,
    speedyPassCount,
    selfCorrectCount,
    levelsMasteredCount: passedLevelIds.size,
  })
}

function newMilestoneLabels(
  beforeProgress: ReturnType<typeof deriveAchievementProgress>,
  currentProgress: ReturnType<typeof deriveAchievementProgress>,
): string[] {
  const beforeByFamily = new Map<AchievementFamilyId, number | null>(
    beforeProgress.map(p => [p.family.id, p.earnedTier]),
  )
  const labels: string[] = []
  for (const cur of currentProgress) {
    const before = beforeByFamily.get(cur.family.id) ?? null
    if (cur.earnedTier !== null && (before === null || cur.earnedTier > before)) {
      // Walk every newly-crossed tier in order so multi-tier weeks list each one.
      for (const tier of cur.family.tiers) {
        if (tier > (before ?? 0) && tier <= cur.earnedTier) {
          labels.push(`${cur.family.emoji} ${cur.family.formatTierBadge(tier)}`)
        }
      }
    }
  }
  // ACHIEVEMENT_FAMILIES already declares a stable display order — reuse it.
  const familyOrder = new Map(ACHIEVEMENT_FAMILIES.map((f, i) => [f.emoji, i]))
  return labels.sort((a, b) => {
    const aIdx = familyOrder.get(a.split(' ')[0]) ?? 99
    const bIdx = familyOrder.get(b.split(' ')[0]) ?? 99
    return aIdx - bIdx
  })
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { todayKey, mondayKey, sundayKey } = getNzWeekRange()
  const lastSundayKey = shiftDateKey(mondayKey, -1)
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, email, name, last_weekly_sent_date')
    .eq('weekly_enabled', true)

  if (profilesErr) {
    return Response.json({ error: profilesErr.message }, { status: 500 })
  }

  const pendingProfiles = (profiles ?? []).filter(p => p.last_weekly_sent_date !== todayKey)

  // Levels are public + small — fetch once per cron run.
  const { data: allLevels } = await supabase
    .from('levels')
    .select('id, level_number, sublevel_number, topic, speed_target_seconds')

  const levels = (allLevels ?? []) as LevelRow[]
  const levelByPair = new Map<string, LevelRow>(
    levels.map(l => [`${l.level_number}.${l.sublevel_number}`, l]),
  )
  const speedTargetByLevel = new Map<number, number | null>(
    levels.map(l => [l.id, l.speed_target_seconds ?? null]),
  )

  const weekStartLabel = dateLabelFromKey(mondayKey)
  const weekEndLabel = dateLabelFromKey(sundayKey)

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

    // Bounded full-history sessions for all students under this parent.
    const { data: sessionsRaw } = await supabase
      .from('sessions')
      .select('id, student_id, completed_at, correct_count, total_problems, accuracy, time_taken_seconds, passed, level_id')
      .in('student_id', studentIds)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(SESSION_FETCH_LIMIT)
    const sessions = (sessionsRaw ?? []) as SessionRow[]

    const allSessionIds = sessions.map(s => s.id)

    // Self-corrected problem rows across all those sessions (one fetch covers
    // the achievement-diff bucketing for every student in this parent).
    let scProblemSessionIds: string[] = []
    if (allSessionIds.length > 0) {
      const { data: scRows } = await supabase
        .from('problems')
        .select('session_id')
        .eq('self_corrected', true)
        .in('session_id', allSessionIds)
      scProblemSessionIds = (scRows ?? []).map(r => r.session_id)
    }

    // Mistake-journal problems for the recent window across all students.
    const recentWindowIds: string[] = []
    const sessionsByStudent = new Map<string, SessionRow[]>()
    for (const stu of students) sessionsByStudent.set(stu.id, [])
    for (const s of sessions) {
      sessionsByStudent.get(s.student_id)?.push(s)
    }
    for (const stuList of sessionsByStudent.values()) {
      for (const s of stuList.slice(0, MISTAKE_JOURNAL_SESSION_WINDOW)) {
        recentWindowIds.push(s.id)
      }
    }
    let mistakeProblems: Array<{
      problem_text: string
      correct_answer: string
      is_correct: boolean | null
      session_id: string
      order_index: number | null
      problem_type: string | null
    }> = []
    if (recentWindowIds.length > 0) {
      const { data: mp } = await supabase
        .from('problems')
        .select('problem_text, correct_answer, is_correct, session_id, order_index, problem_type')
        .in('session_id', recentWindowIds)
      mistakeProblems = mp ?? []
    }

    const studentBlocks: WeeklyStudentBlock[] = []
    for (const stu of students) {
      const stuSessions = sessionsByStudent.get(stu.id) ?? []

      // This-week metrics (NZ Mon → Sun).
      const inWeek = stuSessions.filter(s => {
        if (!s.completed_at) return false
        const k = nzDateKey(s.completed_at)
        return k >= mondayKey && k <= sundayKey
      })
      const practiceDays = new Set<string>()
      let accSum = 0
      for (const s of inWeek) {
        if (s.completed_at) practiceDays.add(nzDateKey(s.completed_at))
        accSum += Number(s.accuracy)
      }
      const accuracy = inWeek.length === 0
        ? null
        : Math.round(accSum / inWeek.length)

      // Per-student self-correct session id list (filter parent-scoped fetch).
      const stuSessionIdSet = new Set(stuSessions.map(s => s.id))
      const stuSelfCorrectIds = scProblemSessionIds.filter(sid => stuSessionIdSet.has(sid))

      // Achievement snapshots — diff "before this week" vs "now".
      const snapshotInput: SnapshotInput = {
        sessions: stuSessions,
        selfCorrectSessionIds: stuSelfCorrectIds,
        speedTargetByLevel,
      }
      const beforeProgress = snapshot(snapshotInput, lastSundayKey)
      const currentProgress = snapshot(snapshotInput, null)
      const newMilestones = newMilestoneLabels(beforeProgress, currentProgress)

      // Top weak area for the student.
      const stuRecentSessions = stuSessions.slice(0, MISTAKE_JOURNAL_SESSION_WINDOW)
      const stuRecentSessionIdSet = new Set(stuRecentSessions.map(s => s.id))
      const stuMistakeProblems = mistakeProblems.filter(p => stuRecentSessionIdSet.has(p.session_id))
      const weak = stuMistakeProblems.length === 0 ? [] : deriveWeakAreas({
        problems: stuMistakeProblems,
        sessions: stuRecentSessions.map(s => ({
          id: s.id,
          level_id: s.level_id,
          completed_at: s.completed_at,
        })),
        levels: levels.map(l => ({
          id: l.id,
          level_number: l.level_number,
          sublevel_number: l.sublevel_number,
          topic: l.topic,
        })),
      })
      const weakAreaLabel = weak.length > 0 ? weak[0].label : null

      // Current focus.
      const focusLevel = levelByPair.get(`${stu.current_level}.${stu.current_sublevel}`) ?? null

      studentBlocks.push({
        name: stu.name,
        practiceDays: practiceDays.size,
        worksheets: inWeek.length,
        accuracy,
        currentLevel: stu.current_level,
        currentSublevel: stu.current_sublevel,
        currentTopic: focusLevel?.topic ?? null,
        newMilestoneLabels: newMilestones,
        weakAreaLabel,
      })
    }

    const unsubToken = createWeeklyUnsubscribeToken(profile.id)
    const unsubscribeUrl = `${appUrl}/account/weekly/unsubscribe?token=${encodeURIComponent(unsubToken)}`

    const email = buildWeeklyReview({
      parentName: profile.name ?? null,
      weekStartLabel,
      weekEndLabel,
      students: studentBlocks,
      appUrl,
      unsubscribeUrl,
    })

    const result = await sendWeeklyReview({
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
      .update({ last_weekly_sent_date: todayKey })
      .eq('id', profile.id)

    if (updErr) {
      errors++
      errorDetails.push({ parentId: profile.id, reason: `dedup write failed: ${updErr.message}` })
      continue
    }

    sent++
  }

  return Response.json({
    todayKey,
    weekStartKey: mondayKey,
    weekEndKey: sundayKey,
    candidates: pendingProfiles.length,
    sent,
    skipped,
    errors,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
  })
}
