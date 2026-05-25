import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNext(next: string | null): string {
  if (!next) return '/account/update-password'
  if (!next.startsWith('/')) return '/account/update-password'
  if (next.startsWith('//')) return '/account/update-password'
  return next
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = safeNext(request.nextUrl.searchParams.get('next'))
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/account/forgot-password?error=expired`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/account/forgot-password?error=expired`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
