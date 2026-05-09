// Daily Reminder Email — pure template builder.
// One evidence-backed reason per pending student plus current focus.
// No Resend/Supabase imports — easy to unit-test by string-comparison.

import { escapeHtml } from '@/lib/email/escapeHtml'

export interface PendingStudent {
  name: string
  currentStreak: number
  daysPractisedThisWeek: number  // 0..7, NZ Mon-start week
  currentLevel: number
  currentSublevel: number
  currentTopic: string | null    // null when no matching levels row
}

export interface BuildDailyReminderArgs {
  parentName: string | null
  pendingStudents: PendingStudent[]   // students who have NOT practised today (NZ)
  appUrl: string                      // e.g. https://mathstep.app — no trailing slash
  unsubscribeUrl: string              // signed unsubscribe URL
}

export interface BuiltEmail {
  subject: string
  html: string
  text: string
}

function reasonLine(s: PendingStudent): string {
  if (s.currentStreak >= 1) {
    return `${s.name} is on a ${s.currentStreak}-day streak — a quick session keeps it going.`
  }
  if (s.daysPractisedThisWeek >= 1) {
    return `${s.name} has practised ${s.daysPractisedThisWeek} of 7 days this week — one more keeps the routine.`
  }
  return 'Consistency is what builds skill — 5 minutes today helps.'
}

function focusLine(s: PendingStudent): string | null {
  if (!s.currentTopic) return null
  return `Current focus: Level ${s.currentLevel}.${s.currentSublevel} — ${s.currentTopic}`
}

export function buildDailyReminder(args: BuildDailyReminderArgs): BuiltEmail {
  const { parentName, pendingStudents, appUrl, unsubscribeUrl } = args
  if (pendingStudents.length === 0) {
    throw new Error('buildDailyReminder requires at least one pending student.')
  }

  const greetingName = (parentName ?? '').trim() || 'there'
  const subject =
    pendingStudents.length === 1
      ? `${pendingStudents[0].name}'s MathStep practice today?`
      : 'Time for MathStep practice?'

  const playUrl = `${appUrl}/play`

  // Plain-text version
  const textBlocks: string[] = [`Hi ${greetingName},`, '']
  for (const s of pendingStudents) {
    textBlocks.push(`${s.name} hasn't practised today yet.`)
    const focus = focusLine(s)
    if (focus) textBlocks.push(focus)
    textBlocks.push(reasonLine(s))
    textBlocks.push('')
  }
  textBlocks.push(
    `Open MathStep: ${playUrl}`,
    '',
    "You're getting daily reminders because they're turned on.",
    '- Turn off daily reminders in Parent View → Admin controls',
    `- Or unsubscribe from daily reminders with one click: ${unsubscribeUrl}`,
  )
  const text = textBlocks.join('\n')

  // HTML version — table-based, inline styles, narrow safe palette.
  const studentBlocksHtml = pendingStudents
    .map(s => {
      const focus = focusLine(s)
      const focusHtml = focus
        ? `<p style="margin:0 0 4px 0;font-size:14px;line-height:1.5;color:#4a6b4e;">${escapeHtml(focus)}</p>`
        : ''
      return `<div style="margin:0 0 16px 0;">
        <p style="margin:0 0 4px 0;font-size:15px;line-height:1.5;color:#1a2e1c;font-weight:600;">${escapeHtml(`${s.name} hasn't practised today yet.`)}</p>
        ${focusHtml}
        <p style="margin:0;font-size:14px;line-height:1.5;color:#4a6b4e;">${escapeHtml(reasonLine(s))}</p>
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
                <p style="margin:0 0 16px 0;font-size:15px;color:#1a2e1c;">Hi ${escapeHtml(greetingName)},</p>
                ${studentBlocksHtml}
                <p style="margin:8px 0 24px 0;">
                  <a href="${escapeHtml(playUrl)}" style="display:inline-block;background:#2d6a35;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Open MathStep</a>
                </p>
                <hr style="border:none;border-top:1px solid #e1f4e3;margin:16px 0;" />
                <p style="margin:0 0 6px 0;font-size:12px;line-height:1.5;color:#4a6b4e;">You're getting daily reminders because they're turned on.</p>
                <p style="margin:0 0 4px 0;font-size:12px;line-height:1.5;color:#4a6b4e;">Turn off daily reminders in Parent View → Admin controls.</p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#4a6b4e;">
                  Or <a href="${escapeHtml(unsubscribeUrl)}" style="color:#2d6a35;">unsubscribe from daily reminders with one click</a>.
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
