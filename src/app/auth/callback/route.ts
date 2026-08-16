import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNext(next: string | null): string {
  if (!next) return '/account/update-password'
  if (!next.startsWith('/')) return '/account/update-password'
  if (next.startsWith('//')) return '/account/update-password'
  return next
}

// `type` arrives from the email link, so it is untrusted input — match it against
// the known email OTP types rather than casting it straight through.
const EMAIL_OTP_TYPES = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
] as const

type EmailOtpType = (typeof EMAIL_OTP_TYPES)[number]

function safeOtpType(type: string | null): EmailOtpType | null {
  return EMAIL_OTP_TYPES.includes(type as EmailOtpType) ? (type as EmailOtpType) : null
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const type = safeOtpType(params.get('type'))
  const next = safeNext(params.get('next'))
  const origin = request.nextUrl.origin

  const expired = NextResponse.redirect(`${origin}/account/forgot-password?error=expired`)

  const supabase = await createClient()

  // token_hash flow — the link verifies on its own, so it works when the email is
  // opened on a different device from the one that requested it (phone vs laptop).
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    return error ? expired : NextResponse.redirect(`${origin}${next}`)
  }

  // PKCE code flow — kept so links already sitting in inboxes still work. This path
  // needs the code_verifier cookie set when the reset was requested, so it only
  // succeeds in the originating browser.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return error ? expired : NextResponse.redirect(`${origin}${next}`)
  }

  return expired
}
