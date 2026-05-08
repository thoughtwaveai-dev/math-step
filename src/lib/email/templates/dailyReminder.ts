// Daily Reminder Email v1 — pure template builder.
// No Resend/Supabase imports — easy to unit-test by string-comparison.

export interface PendingStudent {
  name: string
  currentStreak: number
  daysPractisedThisWeek: number  // 0..7, NZ Mon-start week
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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function studentLine(s: PendingStudent): string {
  if (s.currentStreak >= 1) {
    return `${s.name} hasn't practised today yet. Current streak: ${s.currentStreak} day${
      s.currentStreak === 1 ? '' : 's'
    } · ${s.daysPractisedThisWeek} of 7 days this week.`
  }
  return `${s.name} hasn't practised today yet.`
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
  const lines = pendingStudents.map(studentLine)

  // Plain-text version
  const text = [
    `Hi ${greetingName},`,
    '',
    ...lines,
    '',
    'A quick session keeps the routine going.',
    '',
    `Open MathStep: ${playUrl}`,
    '',
    "You're getting this because daily reminders are on. Turn them off any time from Parent View, or unsubscribe with one click:",
    unsubscribeUrl,
  ].join('\n')

  // HTML version — table-based, inline styles, narrow safe palette.
  const linesHtml = lines
    .map(l => `<p style="margin:0 0 8px 0;font-size:15px;line-height:1.5;color:#1a2e1c;">${escapeHtml(l)}</p>`)
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
                <p style="margin:0 0 12px 0;font-size:15px;color:#1a2e1c;">Hi ${escapeHtml(greetingName)},</p>
                ${linesHtml}
                <p style="margin:12px 0 20px 0;font-size:15px;line-height:1.5;color:#4a6b4e;">A quick session keeps the routine going.</p>
                <p style="margin:0 0 24px 0;">
                  <a href="${escapeHtml(playUrl)}" style="display:inline-block;background:#2d6a35;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Open MathStep</a>
                </p>
                <hr style="border:none;border-top:1px solid #e1f4e3;margin:16px 0;" />
                <p style="margin:0;font-size:12px;line-height:1.5;color:#4a6b4e;">
                  You're getting this because daily reminders are on. Turn them off any time from Parent View, or
                  <a href="${escapeHtml(unsubscribeUrl)}" style="color:#2d6a35;">unsubscribe with one click</a>.
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
