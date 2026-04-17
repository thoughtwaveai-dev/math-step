import Link from 'next/link'
import Image from 'next/image'

export default function DisclaimerPage() {
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
        <h1 className="text-3xl font-bold text-[#1a2e1c] mb-2">Disclaimer</h1>
        <p className="text-sm text-[#4a6b4e] mb-8">Last updated: April 2026 · Beta version</p>

        <div className="space-y-8 text-[#1a2e1c]">
          <section>
            <h2 className="text-lg font-semibold mb-2">Educational practice tool only</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is a supplemental math practice tool. It is not a substitute for school education,
              professional tutoring, or advice from qualified educators. Parents are responsible for all
              educational decisions regarding their children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">No guarantee of academic outcomes</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              We make no representations or warranties that using MathStep will improve your child&apos;s grades,
              test scores, or academic performance. Results vary depending on many factors including consistency
              of practice, age, prior knowledge, and individual learning differences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Curriculum coverage</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep&apos;s curriculum covers a range of topics from basic addition through to linear equations and
              inequalities. Not all topics are available in every level or regional curriculum.
              The app is not aligned to any specific school curriculum or national standard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Beta software limitations</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is in beta. It may contain bugs, incomplete features, or occasional errors in problem generation
              or grading. If you notice an issue, please let us know at{' '}
              <a href="mailto:feedback@mathstep.app" className="text-[#2d6a35] hover:underline">feedback@mathstep.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Parental supervision</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              We recommend parents stay involved in their child&apos;s practice sessions, particularly for younger children.
              Review your child&apos;s recent worksheets via the parent dashboard to understand what they&apos;re working on
              and where they may need extra support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">No liability</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              To the fullest extent permitted by law, MathStep and its creators accept no liability for any loss,
              harm, or damage arising from use of the app, including any reliance on its content or results.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              Questions? Email{' '}
              <a href="mailto:feedback@mathstep.app" className="text-[#2d6a35] hover:underline">feedback@mathstep.app</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#bae0bd] bg-white px-6 py-6 mt-auto">
        <div className="mx-auto max-w-3xl flex flex-wrap justify-center gap-4 text-xs text-[#4a6b4e]">
          <Link href="/" className="hover:text-[#2d6a35] hover:underline">Home</Link>
          <Link href="/privacy" className="hover:text-[#2d6a35] hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:text-[#2d6a35] hover:underline">Terms</Link>
          <a href="mailto:feedback@mathstep.app" className="hover:text-[#2d6a35] hover:underline">Send feedback</a>
        </div>
      </footer>
    </div>
  )
}
