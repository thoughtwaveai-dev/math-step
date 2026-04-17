import Link from 'next/link'
import Image from 'next/image'

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf7]">
      <header className="border-b border-[#bae0bd] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/math-step-logo.png" alt="MathStep" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-bold text-[#1a2e1c]">MathStep</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold text-[#1a2e1c] mb-2">Terms of Use</h1>
        <p className="text-sm text-[#4a6b4e] mb-8">Last updated: April 2026 · Beta version</p>

        <div className="space-y-8 text-[#1a2e1c]">
          <section>
            <h2 className="text-lg font-semibold mb-2">About MathStep</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is a math practice tool for children, managed by a parent or guardian.
              It is currently in beta and provided free of charge. By using MathStep, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Who can use it</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep accounts must be created by a parent or guardian aged 18 or over.
              Children use the app under parental supervision via the parent&apos;s account.
              You are responsible for ensuring your child uses the app appropriately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">What MathStep is</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is a supplemental practice tool, not a replacement for school or professional tutoring.
              It provides structured worksheets, progress tracking, and level-based progression.
              Parents make all educational decisions — the app is a tool to support those decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">No guarantees</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is provided as-is. We do not guarantee specific academic outcomes, improvements in grades,
              or any particular result from using the app. See also our{' '}
              <Link href="/disclaimer" className="text-[#2d6a35] hover:underline">Disclaimer</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Beta software</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is in active development. Features may change, be removed, or be unavailable from time to time.
              We appreciate your patience and welcome feedback at{' '}
              <a href="mailto:mathstepfeedback@gmail.com" className="text-[#2d6a35] hover:underline">mathstepfeedback@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Your account</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              You are responsible for keeping your login credentials secure. Do not share your account with
              people outside your household. If you believe your account has been accessed without authorisation,
              contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Acceptable use</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              Please use MathStep for its intended purpose. Do not attempt to reverse-engineer, scrape, or abuse the service.
              We reserve the right to suspend accounts that misuse the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              Questions or concerns? Email{' '}
              <a href="mailto:mathstepfeedback@gmail.com" className="text-[#2d6a35] hover:underline">mathstepfeedback@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#bae0bd] bg-white px-6 py-6 mt-auto">
        <div className="mx-auto max-w-3xl flex flex-wrap justify-center gap-4 text-xs text-[#4a6b4e]">
          <Link href="/" className="hover:text-[#2d6a35] hover:underline">Home</Link>
          <Link href="/privacy" className="hover:text-[#2d6a35] hover:underline">Privacy</Link>
          <Link href="/disclaimer" className="hover:text-[#2d6a35] hover:underline">Disclaimer</Link>
          <Link href="/feedback" className="hover:text-[#2d6a35] hover:underline">Send feedback</Link>
        </div>
      </footer>
    </div>
  )
}
