import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const LEGACY_HOST = 'math-steps.vercel.app'
const CANONICAL_ORIGIN = 'https://mathstep.nz'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  const { pathname, search } = request.nextUrl

  // Redirect old Vercel URL → canonical domain, preserving path + query.
  // Skip /api/* so Vercel cron (e.g. /api/cron/daily-reminders) is unaffected
  // regardless of which host Vercel uses internally.
  if (host === LEGACY_HOST && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(`${CANONICAL_ORIGIN}${pathname}${search}`, 308)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
