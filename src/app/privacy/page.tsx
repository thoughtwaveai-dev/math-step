import Link from 'next/link'
import Image from 'next/image'

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-[#1a2e1c] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#4a6b4e] mb-8">Last updated: April 2026 · Beta version</p>

        <div className="space-y-8 text-[#1a2e1c]">
          <section>
            <h2 className="text-lg font-semibold mb-2">What we collect</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              We collect the email address and password you use to sign up, and the name(s) you enter for your child/children.
              We also store session data from worksheet practice: scores, accuracy, time taken, and level progress.
              This is the minimum needed to run the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">What we do not collect</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              We do not collect payment information (MathStep is free during beta).
              We do not collect your child&apos;s full name, date of birth, school, or any other personally identifiable information beyond a first name or nickname.
              We do not track behaviour across other websites or apps.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">How we use your data</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              Your data is used solely to run the MathStep service — logging you in, saving your child&apos;s progress,
              and displaying their stats. We do not sell your data, share it with advertisers, or use it for any purpose
              beyond operating the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Where data is stored</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              Data is stored on Supabase (hosted Postgres). Supabase is a third-party service based in the United States.
              By using MathStep, you consent to your data being stored there. We use Supabase&apos;s built-in row-level security
              to ensure parents can only access their own data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Children&apos;s privacy</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              MathStep is designed for parents to set up on behalf of their children. We do not knowingly collect data
              directly from children. The parent account is the primary account, and children use it supervised.
              We only store a first name or nickname for the child — not a full name.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Deleting your data</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              If you want your account and all associated data deleted, email us at{' '}
              <a href="mailto:feedback@mathstep.app" className="text-[#2d6a35] hover:underline">feedback@mathstep.app</a>.
              We will delete it within 14 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Changes to this policy</h2>
            <p className="text-sm text-[#4a6b4e] leading-relaxed">
              As MathStep is in beta, this policy may change as the product evolves.
              We will note the date of any updates at the top of this page.
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
          <Link href="/terms" className="hover:text-[#2d6a35] hover:underline">Terms</Link>
          <Link href="/disclaimer" className="hover:text-[#2d6a35] hover:underline">Disclaimer</Link>
          <Link href="/feedback" className="hover:text-[#2d6a35] hover:underline">Send feedback</Link>
        </div>
      </footer>
    </div>
  )
}
