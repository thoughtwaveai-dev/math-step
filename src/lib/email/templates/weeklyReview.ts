// Weekly Review Email — pure template builder.
// Combined per parent across all their students. Empty-week variant supported.
// No Resend/Supabase imports — easy to unit-test by string-comparison.

import { escapeHtml } from '@/lib/email/escapeHtml'

export interface WeeklyStudentBlock {
  name: string
  practiceDays: number          // 0..7
  worksheets: number            // sessions completed in week
  accuracy: number | null       // 0..100, or null when no worksheets
  currentLevel: number
  currentSublevel: number
  currentTopic: string | null
  newMilestoneLabels: string[]  // formatTierBadge() outputs; empty array if none
  weakAreaLabel: string | null  // parentLabelForType / level fallback; null if none
}

export interface BuildWeeklyReviewArgs {
  parentName: string | null
  weekStartLabel: string        // "5 May"
  weekEndLabel: string          // "11 May"
  students: WeeklyStudentBlock[]
  appUrl: string                // no trailing slash
  unsubscribeUrl: string
}

export interface BuiltEmail {
  subject: string
  html: string
  text: string
}

function focusLabel(s: WeeklyStudentBlock): string | null {
  if (!s.currentTopic) return null
  return `Level ${s.currentLevel}.${s.currentSublevel} — ${s.currentTopic}`
}

function insightLine(s: WeeklyStudentBlock): string {
  const acc = s.accuracy ?? 0
  if (s.practiceDays >= 5 && acc >= 90) {
    return `Great consistency this week — ${s.name} practised ${s.practiceDays} days and averaged ${acc}%.`
  }
  if (s.practiceDays >= 3 && acc >= 80) {
    return `Solid progress — ${s.name} kept practising and is building momentum.`
  }
  if (acc < 80) {
    return `Good effort this week — the lower accuracy shows where practice can help next.`
  }
  if (s.practiceDays <= 1) {
    return `A small start this week — one or two short sessions next week can build the routine.`
  }
  return `${s.name} kept the routine going this week.`
}

export function buildWeeklyReview(args: BuildWeeklyReviewArgs): BuiltEmail {
  const { parentName, weekStartLabel, weekEndLabel, students, appUrl, unsubscribeUrl } = args
  if (students.length === 0) {
    throw new Error('buildWeeklyReview requires at least one student.')
  }

  const firstName = (parentName ?? '').trim().split(/\s+/)[0] || ''
  const greetingPrefix = firstName ? firstName : 'Hi there'

  const subject =
    students.length === 1
      ? `${students[0].name}'s MathStep week`
      : "Your kids' MathStep week"

  const dashboardUrl = `${appUrl}/dashboard`
  const headerLine = `${greetingPrefix}, here's the recap for ${weekStartLabel} – ${weekEndLabel}.`

  // -------- Plain-text version --------
  const textBlocks: string[] = [headerLine, '']
  for (const s of students) {
    textBlocks.push(s.name)
    if (s.worksheets === 0) {
      textBlocks.push("No worksheets this week — that's okay, every week is a fresh start.")
      const focus = focusLabel(s)
      if (focus) textBlocks.push(`🎯 Ready to continue: ${focus}`)
    } else {
      const acc = s.accuracy ?? 0
      textBlocks.push(
        `📊 ${s.practiceDays} practice days · ${s.worksheets} worksheets · ${acc}% accuracy`,
      )
      textBlocks.push(insightLine(s))
      const focus = focusLabel(s)
      if (focus) textBlocks.push(`🎯 Current focus: ${focus}`)
      if (s.newMilestoneLabels.length > 0) {
        textBlocks.push('🏆 New this week:')
        for (const label of s.newMilestoneLabels) textBlocks.push(`  • ${label}`)
      }
      if (s.weakAreaLabel) {
        textBlocks.push(`⚠️ Needs practice: ${s.weakAreaLabel}`)
      }
    }
    textBlocks.push('')
  }
  textBlocks.push(
    `Open Parent View: ${dashboardUrl}`,
    '',
    'Weekly progress emails are on by default.',
    '- Turn off weekly emails in Parent View → Admin controls',
    `- Or unsubscribe with one click: ${unsubscribeUrl}`,
  )
  const text = textBlocks.join('\n')

  // -------- HTML version --------
  const studentBlocksHtml = students
    .map(s => {
      const headingHtml = `<p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#1a2e1c;">${escapeHtml(s.name)}</p>`

      if (s.worksheets === 0) {
        const focus = focusLabel(s)
        const focusHtml = focus
          ? `<p style="margin:4px 0 0 0;font-size:14px;line-height:1.5;color:#1a2e1c;">🎯 Ready to continue: ${escapeHtml(focus)}</p>`
          : ''
        return `<div style="margin:0 0 20px 0;padding:14px 16px;background:#f7faf7;border:1px solid #e1f4e3;border-radius:10px;">
          ${headingHtml}
          <p style="margin:0;font-size:14px;line-height:1.5;color:#4a6b4e;">${escapeHtml("No worksheets this week — that's okay, every week is a fresh start.")}</p>
          ${focusHtml}
        </div>`
      }

      const acc = s.accuracy ?? 0
      const metricsHtml = `<p style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#1a2e1c;">📊 ${s.practiceDays} practice days · ${s.worksheets} worksheets · ${acc}% accuracy</p>`

      const insightHtml = `<p style="margin:0 0 10px 0;font-size:14px;line-height:1.5;color:#4a6b4e;">${escapeHtml(insightLine(s))}</p>`

      const focus = focusLabel(s)
      const focusHtml = focus
        ? `<p style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#1a2e1c;">🎯 Current focus: ${escapeHtml(focus)}</p>`
        : ''

      const milestonesHtml = s.newMilestoneLabels.length > 0
        ? `<p style="margin:8px 0 4px 0;font-size:14px;line-height:1.5;color:#1a2e1c;font-weight:600;">🏆 New this week:</p>
           <ul style="margin:0 0 6px 18px;padding:0;font-size:14px;line-height:1.5;color:#1a2e1c;">
             ${s.newMilestoneLabels.map(l => `<li style="margin:0 0 2px 0;">${escapeHtml(l)}</li>`).join('')}
           </ul>`
        : ''

      const weakHtml = s.weakAreaLabel
        ? `<p style="margin:6px 0 0 0;font-size:14px;line-height:1.5;color:#a85630;">⚠️ Needs practice: ${escapeHtml(s.weakAreaLabel)}</p>`
        : ''

      return `<div style="margin:0 0 20px 0;padding:14px 16px;background:#f7faf7;border:1px solid #e1f4e3;border-radius:10px;">
        ${headingHtml}
        ${metricsHtml}
        ${insightHtml}
        ${focusHtml}
        ${milestonesHtml}
        ${weakHtml}
      </div>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7faf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7faf7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #bae0bd;border-radius:12px;padding:28px 28px 20px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.5;color:#1a2e1c;">${escapeHtml(headerLine)}</p>
                ${studentBlocksHtml}
                <p style="margin:8px 0 24px 0;">
                  <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#2d6a35;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Open Parent View</a>
                </p>
                <hr style="border:none;border-top:1px solid #e1f4e3;margin:16px 0;" />
                <p style="margin:0 0 6px 0;font-size:12px;line-height:1.5;color:#4a6b4e;">Weekly progress emails are on by default.</p>
                <p style="margin:0 0 4px 0;font-size:12px;line-height:1.5;color:#4a6b4e;">Turn off weekly emails in Parent View → Admin controls.</p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#4a6b4e;">
                  Or <a href="${escapeHtml(unsubscribeUrl)}" style="color:#2d6a35;">unsubscribe with one click</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
