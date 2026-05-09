// Resend integration for transactional email.
// Server-only: never import from client components.

import { Resend } from 'resend'

let cached: Resend | null = null

function getClient(): Resend {
  if (cached) return cached
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set.')
  }
  cached = new Resend(apiKey)
  return cached
}

export type SendResult = { ok: true; id?: string } | { ok: false; error: string }

interface SendArgs {
  from: string
  to: string
  subject: string
  html: string
  text: string
}

async function send(args: SendArgs): Promise<SendResult> {
  try {
    const resend = getClient()
    const { data, error } = await resend.emails.send({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    })
    if (error) return { ok: false, error: error.message ?? 'Resend error' }
    return { ok: true, id: data?.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown send error',
    }
  }
}

export async function sendDailyReminder(args: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  const from = process.env.REMINDER_FROM_EMAIL
  if (!from) return { ok: false, error: 'REMINDER_FROM_EMAIL is not set.' }
  return send({ from, ...args })
}

export async function sendWeeklyReview(args: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  const from = process.env.WEEKLY_FROM_EMAIL ?? process.env.REMINDER_FROM_EMAIL
  if (!from) return { ok: false, error: 'WEEKLY_FROM_EMAIL / REMINDER_FROM_EMAIL is not set.' }
  return send({ from, ...args })
}
