import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import FeedbackForm from './FeedbackForm'

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  idea: 'Idea',
  confusion: 'Confusion',
  praise: 'Praise',
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-50 text-red-700',
  idea: 'bg-blue-50 text-blue-700',
  confusion: 'bg-amber-50 text-amber-700',
  praise: 'bg-[#e1f4e3] text-[#2d6a35]',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true })

  const { data: recentFeedback } = await supabase
    .from('feedback')
    .select('id, category, message, created_at, student_id, student_name')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const studentMap = new Map((students ?? []).map(s => [s.id, s.name]))

  const sp = await searchParams
  const justSent = sp.sent === '1'

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/math-step-logo.png" alt="MathStep" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-bold text-[#1a2e1c]">MathStep</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#4a6b4e] hover:text-[#2d6a35] transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1c]">Send feedback</h1>
          <p className="mt-1 text-sm text-[#4a6b4e]">Share a bug, idea, or anything else about your experience.</p>
        </div>

        {justSent && (
          <div className="rounded-xl border border-[#bae0bd] bg-[#e1f4e3] px-5 py-4">
            <p className="text-sm font-semibold text-[#2d6a35]">Thanks — your feedback was sent!</p>
            <p className="text-sm text-[#4a6b4e] mt-0.5">We read every submission. It helps us improve MathStep.</p>
          </div>
        )}

        <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
          <FeedbackForm students={students ?? []} />
        </div>

        {recentFeedback && recentFeedback.length > 0 && (
          <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1a2e1c] mb-4">Your recent feedback</h2>
            <div className="space-y-3">
              {recentFeedback.map(item => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#e8f5e9] bg-[#f7faf7] px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    {(item.student_id || item.student_name) && (
                      <span className="text-xs text-[#4a6b4e]">
                        {studentMap.get(item.student_id) ?? item.student_name}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-[#4a6b4e]">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#1a2e1c] line-clamp-3">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
