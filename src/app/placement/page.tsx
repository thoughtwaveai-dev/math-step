import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import PlacementForm from './PlacementForm'

export default async function PlacementPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const studentId = sp.student
  if (!studentId) redirect('/dashboard')

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!student) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        <PlacementForm studentId={student.id} studentName={student.name} />
      </main>
    </div>
  )
}
