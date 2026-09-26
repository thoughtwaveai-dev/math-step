// Curriculum Renewal Email: pure template builder.
// A separate email with an "Action needed" subject, sent by the weekly-review
// cron when a student is close to the end of the curriculum. The weekly email
// line alone was easy to miss.
// No Resend/Supabase imports, same as weeklyReview.ts.

import { escapeHtml } from '@/lib/email/escapeHtml'
import type { BuiltEmail } from '@/lib/email/templates/weeklyReview'

// Send when a student has this many levels (or fewer) after their current one.
// A level takes about 3 to 5 days, so 3 left gives roughly two weeks of lead time.
export const RENEWAL_THRESHOLD = 3

export interface RenewalStudent {
  name: string
  currentLevel: number
  currentSublevel: number
  currentTopic: string | null
  levelsLeft: number            // levels ordered after the current one; 0 = on the last level
}

export interface BuildCurriculumRenewalArgs {
  parentName: string | null
  students: RenewalStudent[]    // only students at or under RENEWAL_THRESHOLD
  appUrl: string                // no trailing slash
}

// Number of levels ordered after (level, sublevel). Same ordering as advancement.
export function countLevelsAfter(
  levels: { level_number: number; sublevel_number: number }[],
  currentLevel: number,
  currentSublevel: number,
): number {
  return levels.filter(l =>
    l.level_number > currentLevel ||
    (l.level_number === currentLevel && l.sublevel_number > currentSublevel)
  ).length
}

function nowOnLine(s: RenewalStudent): string {
  const level = `Level ${s.currentLevel}.${s.currentSublevel}`
  return s.currentTopic ? `${level}, ${s.currentTopic}` : level
}

function levelsLeftLine(s: RenewalStudent): string {
  if (s.levelsLeft === 0) return 'Levels left after this one: 0. This is the last level.'
  return `Levels left after this one: ${s.levelsLeft}`
}

export function buildCurriculumRenewal(args: BuildCurriculumRenewalArgs): BuiltEmail {
  const { parentName, students, appUrl } = args
  if (students.length === 0) {
    throw new Error('buildCurriculumRenewal requires at least one student.')
  }

  const firstName = (parentName ?? '').trim().split(/\s+/)[0] || ''
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there'

  let subject: string
  if (students.length === 1) {
    const s = students[0]
    const left = s.levelsLeft === 0 ? 'on the last level' : `${s.levelsLeft} left`
    subject = `Action needed: add new MathStep levels for ${s.name} (${left})`
  } else {
    subject = `Action needed: add new MathStep levels for ${students.map(s => s.name).join(' and ')}`
  }

  const dashboardUrl = `${appUrl}/dashboard`
  const headerLine = `${greeting}, it is time to add new MathStep levels.`
  const footerLines = [
    `This email comes on Sundays while a student has ${RENEWAL_THRESHOLD} or fewer levels left. It stops once new levels are added.`,
    'It is part of the weekly emails. Turn those off in Parent View → Admin controls.',
  ]

  // -------- Plain-text version --------
  const textBlocks: string[] = [headerLine, '']
  for (const s of students) {
    textBlocks.push(
      s.name,
      `Now on: ${nowOnLine(s)}`,
      levelsLeftLine(s),
      `Add new levels before ${s.name} runs out.`,
      '',
    )
  }
  textBlocks.push(`Open Parent View: ${dashboardUrl}`, '', ...footerLines)
  const text = textBlocks.join('\n')

  // -------- HTML version --------
  const studentBlocksHtml = students
    .map(s => `<div style="margin:0 0 20px 0;padding:14px 16px;background:#fdf6f1;border:1px solid #f0d9c8;border-radius:10px;">
        <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#1a2e1c;">${escapeHtml(s.name)}</p>
        <p style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#1a2e1c;">Now on: ${escapeHtml(nowOnLine(s))}</p>
        <p style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:#a85630;font-weight:600;">${escapeHtml(levelsLeftLine(s))}</p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:#1a2e1c;">${escapeHtml(`Add new levels before ${s.name} runs out.`)}</p>
      </div>`)
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
                ${footerLines.map(l => `<p style="margin:0 0 4px 0;font-size:12px;line-height:1.5;color:#4a6b4e;">${escapeHtml(l)}</p>`).join('')}
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
