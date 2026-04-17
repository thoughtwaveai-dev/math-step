import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={88}
            height={88}
            className="rounded-2xl shadow-sm"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#1a2e1c] sm:text-5xl">MathStep</h1>
        <p className="mt-3 mb-2 text-lg text-[#2d6a35] font-medium">Structured math practice for kids.</p>
        <p className="mb-10 max-w-sm text-base text-[#4a6b4e]">
          Daily worksheets, streak tracking, and a curriculum that builds real mastery — one level at a time.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-xl bg-[#2d6a35] px-8 py-3.5 text-base font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-[#bae0bd] bg-white px-8 py-3.5 text-base font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            Log in
          </Link>
        </div>

        <p className="mt-5 text-xs text-[#4a6b4e] opacity-70">Free during beta · Works great on tablet and mobile</p>
      </main>

      {/* How it works */}
      <section className="bg-white border-t border-[#bae0bd] px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-[#1a2e1c]">How it works</h2>
          <p className="mb-10 text-center text-sm text-[#4a6b4e]">Set up once. Practice daily. Watch progress build.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#bae0bd] bg-[#f7faf7] p-6 text-center">
              <div className="mb-3 text-3xl">1</div>
              <h3 className="font-semibold text-[#1a2e1c] mb-1">Create an account</h3>
              <p className="text-sm text-[#4a6b4e]">Sign up as a parent and add your child by name. Takes about 60 seconds.</p>
            </div>
            <div className="rounded-2xl border border-[#bae0bd] bg-[#f7faf7] p-6 text-center">
              <div className="mb-3 text-3xl">2</div>
              <h3 className="font-semibold text-[#1a2e1c] mb-1">Practice daily worksheets</h3>
              <p className="text-sm text-[#4a6b4e]">Your child works through timed worksheets at their current level. Questions adapt as they master each topic.</p>
            </div>
            <div className="rounded-2xl border border-[#bae0bd] bg-[#f7faf7] p-6 text-center">
              <div className="mb-3 text-3xl">3</div>
              <h3 className="font-semibold text-[#1a2e1c] mb-1">Track their progress</h3>
              <p className="text-sm text-[#4a6b4e]">Monitor streaks, points, and recent sessions from your parent dashboard. No guesswork.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why MathStep */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-[#1a2e1c]">Why MathStep?</h2>
          <p className="mb-10 text-center text-sm text-[#4a6b4e]">Built for kids who need structure without the repetition fatigue.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Mastery-based progression</p>
              <p className="text-sm text-[#4a6b4e]">Students only advance when they&apos;ve genuinely mastered a level — accuracy and speed both count.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">No busywork</p>
              <p className="text-sm text-[#4a6b4e]">Unlike repetitive printout-style tutoring, each session is targeted and efficient — typically 10–15 minutes.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Built for daily habits</p>
              <p className="text-sm text-[#4a6b4e]">Streak tracking and points keep kids motivated to come back every day without nagging.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Parent in control</p>
              <p className="text-sm text-[#4a6b4e]">Parents see what their child is working on, review recent sessions, and can adjust placement if needed.</p>
            </div>
          </div>

          <p className="mt-8 rounded-xl border border-[#bae0bd] bg-white p-5 text-sm text-[#4a6b4e] text-center">
            Works on tablet, phone, and desktop — hand your child the iPad and they&apos;re ready to go.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#bae0bd] bg-white px-6 py-8">
        <div className="mx-auto max-w-3xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-[#4a6b4e]">© 2026 MathStep · Beta</p>
          <nav className="flex flex-wrap justify-center gap-4 text-xs text-[#4a6b4e]">
            <Link href="/privacy" className="hover:text-[#2d6a35] hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-[#2d6a35] hover:underline">Terms</Link>
            <Link href="/disclaimer" className="hover:text-[#2d6a35] hover:underline">Disclaimer</Link>
            <Link href="/feedback" className="hover:text-[#2d6a35] hover:underline">Send feedback</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
