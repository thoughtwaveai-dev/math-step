import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex justify-center mb-8">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={112}
            height={112}
            className="rounded-2xl shadow-md"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#1a2e1c] sm:text-5xl">MathStep</h1>
        <p className="mt-3 mb-2 text-lg text-[#2d6a35] font-medium">Structured daily math practice for kids.</p>
        <p className="mb-10 max-w-md text-base text-[#4a6b4e]">
          Short daily sessions with instant marking, worked examples, and a curriculum that builds real fluency — one level at a time.
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
              <h3 className="font-semibold text-[#1a2e1c] mb-1">Practice daily</h3>
              <p className="text-sm text-[#4a6b4e]">Your child works through timed worksheets at their level. Answers are marked instantly. Worked examples are always available. They advance only when they&apos;ve genuinely mastered a topic.</p>
            </div>
            <div className="rounded-2xl border border-[#bae0bd] bg-[#f7faf7] p-6 text-center">
              <div className="mb-3 text-3xl">3</div>
              <h3 className="font-semibold text-[#1a2e1c] mb-1">Track their progress</h3>
              <p className="text-sm text-[#4a6b4e]">Monitor streaks, accuracy trends, and recent sessions from your parent dashboard. No guesswork about where they&apos;re at.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-[#1a2e1c]">What makes MathStep different</h2>
          <p className="mb-10 text-center text-sm text-[#4a6b4e]">Built around how kids actually build fluency — not just how many problems they complete.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Instant marking</p>
              <p className="text-sm text-[#4a6b4e]">Every answer is marked the moment it&apos;s submitted — no waiting, no manual checking. Your child knows exactly where they stand after every session.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Worked examples at every level</p>
              <p className="text-sm text-[#4a6b4e]">Each level includes a step-by-step worked example before the worksheet starts. Kids can refer back to it at any time during practice.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Self-correction after results</p>
              <p className="text-sm text-[#4a6b4e]">After a session, students can review every wrong answer and try to correct it. This reflection loop reinforces understanding rather than just moving on.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Mastery-based progression</p>
              <p className="text-sm text-[#4a6b4e]">Students only advance when they&apos;ve hit both the accuracy and speed targets — consistently. There&apos;s no skipping ahead before a topic is solid.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Stuck-mode support</p>
              <p className="text-sm text-[#4a6b4e]">If a student struggles on a level for several sessions, the app automatically surfaces warm-up problems from the prior sublevel to rebuild confidence before attempting the main worksheet again.</p>
            </div>
            <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
              <p className="font-semibold text-[#1a2e1c] mb-1">Parent visibility</p>
              <p className="text-sm text-[#4a6b4e]">The parent dashboard shows every recent session, accuracy trends, mastery progress, and an alert if your child is finding a level difficult — so you can step in when it matters.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#bae0bd] bg-white p-5">
            <p className="font-semibold text-[#1a2e1c] mb-1">Short sessions that fit real life</p>
            <p className="text-sm text-[#4a6b4e]">
              Sessions typically take 10–15 minutes. That&apos;s enough to build a consistent daily habit without it becoming a chore.
              Works on tablet, phone, and desktop — hand your child the iPad and they&apos;re ready to go.
            </p>
          </div>
        </div>
      </section>

      {/* What MathStep is */}
      <section className="bg-white border-t border-[#bae0bd] px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-xl font-bold text-[#1a2e1c]">A practice system, not a live tutor</h2>
          <p className="text-sm text-[#4a6b4e] leading-relaxed max-w-lg mx-auto">
            MathStep teaches through examples, marks answers instantly, and guides students through their mistakes.
            Parents stay informed and can step in when a topic needs more explanation.
            It&apos;s designed for independent daily practice — not to replace every kind of teaching.
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
