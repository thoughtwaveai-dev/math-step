import Link from 'next/link'
import Image from 'next/image'
import { FAQ_ITEMS } from '@/lib/helpContent'

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      {/* Header */}
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/math-step-logo.png"
              alt="MathStep"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-[#1a2e1c]">MathStep</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[#bae0bd] bg-white px-3.5 py-2 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-10 space-y-10">
        {/* Page title */}
        <div>
          <h1 className="text-3xl font-bold text-[#1a2e1c]">Help &amp; Guide</h1>
          <p className="mt-2 text-sm text-[#4a6b4e]">Everything you need to know about using MathStep.</p>
        </div>

        {/* What is MathStep */}
        <section className="rounded-xl border border-[#bae0bd] bg-white p-6 space-y-3">
          <h2 className="text-lg font-bold text-[#1a2e1c]">What is MathStep?</h2>
          <p className="text-sm text-[#4a6b4e] leading-relaxed">
            MathStep is a structured daily math practice app for children ages 7–14. It covers topics
            from basic addition through algebra, using short timed worksheets, instant marking, and
            step-by-step worked examples.
          </p>
          <p className="text-sm text-[#4a6b4e] leading-relaxed">
            It is a <strong className="text-[#1a2e1c]">practice system, not a live tutor</strong> — the app
            teaches through examples, marks answers instantly, and guides students through their mistakes.
            Parents stay informed and can step in when a topic needs extra explanation.
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1a2e1c]">How it works</h2>
          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'Create an account',
                body: "Sign up as a parent with your own email. You never need to create an account for your child — just enter their first name.",
              },
              {
                step: '2',
                title: 'Add your child',
                body: "After sign-up you'll be prompted to add a student by name. This takes under 60 seconds. You can add more than one child.",
              },
              {
                step: '3',
                title: 'Your child practises daily',
                body: "Open the Play page and hand the device to your child. They work through a short timed worksheet — answers are marked instantly.",
              },
              {
                step: '4',
                title: 'Track progress from the Dashboard',
                body: "The Dashboard (parent view) shows streaks, accuracy trends, recent sessions, and an alert if your child is finding a level difficult.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4 rounded-xl border border-[#bae0bd] bg-white p-5">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#e1f4e3] flex items-center justify-center text-sm font-bold text-[#2d6a35]">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-[#1a2e1c] text-sm">{title}</p>
                  <p className="mt-1 text-sm text-[#4a6b4e]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Parent vs student view */}
        <section className="rounded-xl border border-[#bae0bd] bg-white p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1a2e1c]">Parent view vs Student view</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[#f7faf7] p-4">
              <p className="font-semibold text-[#1a2e1c] text-sm mb-2">Parent view — Dashboard</p>
              <ul className="space-y-1 text-sm text-[#4a6b4e]">
                <li>— Progress, streaks, and points</li>
                <li>— Recent worksheet history</li>
                <li>— Accuracy trend charts</li>
                <li>— Stuck alert with guidance</li>
                <li>— Admin controls (adjust level)</li>
                <li>— Add students</li>
              </ul>
            </div>
            <div className="rounded-lg bg-[#f7faf7] p-4">
              <p className="font-semibold text-[#1a2e1c] text-sm mb-2">Student view — Play page</p>
              <ul className="space-y-1 text-sm text-[#4a6b4e]">
                <li>— Simple and focused</li>
                <li>— Current topic and progress bar</li>
                <li>— One-tap worksheet start</li>
                <li>— Last session summary</li>
                <li>— Worked example + warm-up if stuck</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-[#4a6b4e]">
            Switch between views using the <span className="font-medium">Parent view</span> and{' '}
            <span className="font-medium">Open Student View</span> buttons at the top of each page.
          </p>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1a2e1c]">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-[#bae0bd] bg-white p-5">
                <p className="font-semibold text-[#1a2e1c] text-sm mb-1">{q}</p>
                <p className="text-sm text-[#4a6b4e]">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Still need help */}
        <section className="rounded-xl border border-[#bae0bd] bg-white p-6 text-center space-y-3">
          <h2 className="text-base font-bold text-[#1a2e1c]">Still have a question?</h2>
          <p className="text-sm text-[#4a6b4e]">Send us a message using the feedback form — we read every submission.</p>
          <Link
            href="/feedback"
            className="inline-block rounded-xl bg-[#2d6a35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Send feedback
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#bae0bd] bg-white px-6 py-8 mt-6">
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
