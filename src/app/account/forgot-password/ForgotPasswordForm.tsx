'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { requestPasswordReset } from '@/app/actions/auth'

export default function ForgotPasswordForm({ expired = false }: { expired?: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordReset, null)

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

        <h1 className="mb-1 text-center text-2xl font-bold text-[#1a2e1c]">Reset your password</h1>
        <p className="mb-7 text-center text-sm text-[#4a6b4e]">
          Enter your account email and we&apos;ll send you a link to reset your password.
        </p>

        <div className="rounded-2xl border border-[#bae0bd] bg-white p-6 shadow-sm">
          {state?.sent ? (
            <div className="flex flex-col gap-3 text-sm text-[#1a2e1c]">
              <p className="font-medium">Check your inbox</p>
              <p className="text-[#4a6b4e]">
                If an account exists for that email, a reset link has been sent. Please check your
                inbox (and spam folder).
              </p>
              {/* Deliberately does not confirm whether the address matched an account — that
                  would let anyone test which families have a MathStep account. This points a
                  parent who used a different address at the next step instead. */}
              <p className="text-[#4a6b4e]">
                Nothing after a few minutes? You may have signed up with a different email
                address.
              </p>
              <a
                href="/account/forgot-password"
                className="rounded-xl border border-[#bae0bd] bg-white px-4 py-3 text-center text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
              >
                Try another email address
              </a>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              {state?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              {expired && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                  That reset link has expired. Enter your email to send a new one.
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-[#1a2e1c]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  required
                  autoComplete="email"
                  className="rounded-lg border border-[#bae0bd] px-3.5 py-3 text-sm text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd]"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[#2d6a35] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
              >
                {pending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-[#4a6b4e]">
          <Link href="/login" className="font-semibold text-[#2d6a35] underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
