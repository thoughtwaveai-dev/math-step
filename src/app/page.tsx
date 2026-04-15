import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7faf7] px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={80}
            height={80}
            className="rounded-2xl shadow-sm"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#1a2e1c]">MathStep</h1>
        <p className="mt-2 mb-8 text-base text-[#4a6b4e]">Step-by-step math learning for kids.</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-xl bg-[#2d6a35] px-8 py-3.5 text-base font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-[#bae0bd] bg-white px-8 py-3.5 text-base font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            Log in
          </Link>
        </div>

        <p className="mt-8 text-sm text-[#4a6b4e] opacity-70">
          Build streaks. Master every level.
        </p>
      </div>
    </div>
  )
}
