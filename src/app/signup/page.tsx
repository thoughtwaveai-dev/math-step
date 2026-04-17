'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signUp } from '@/app/actions/auth'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image
            src="/math-step-logo.png"
            alt="MathStep"
            width={64}
            height={64}
            className="rounded-xl shadow-sm"
            priority
          />
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-[#1a2e1c]">Create your account</h1>
        <p className="mb-7 text-center text-sm text-[#4a6b4e]">Start your child&apos;s math journey</p>

        <div className="rounded-2xl border border-[#bae0bd] bg-white p-6 shadow-sm">
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-[#1a2e1c]">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="rounded-lg border border-[#bae0bd] px-3.5 py-3 text-sm text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#1a2e1c]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-[#bae0bd] px-3.5 py-3 text-sm text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#1a2e1c]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="rounded-lg border border-[#bae0bd] px-3.5 py-3 text-sm text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd]"
              />
            </div>

            {state?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-[#2d6a35] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
            >
              {pending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[#4a6b4e]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#2d6a35] underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
