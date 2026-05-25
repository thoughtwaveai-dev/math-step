import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import UpdatePasswordForm from './UpdatePasswordForm'

export const dynamic = 'force-dynamic'

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

        {user ? (
          <>
            <h1 className="mb-1 text-center text-2xl font-bold text-[#1a2e1c]">
              Set a new password
            </h1>
            <p className="mb-7 text-center text-sm text-[#4a6b4e]">
              Pick a password you&apos;ll remember next time.
            </p>

            <div className="rounded-2xl border border-[#bae0bd] bg-white p-6 shadow-sm">
              <UpdatePasswordForm />
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-center text-2xl font-bold text-[#1a2e1c]">
              This page is only for password reset
            </h1>
            <p className="mb-7 text-center text-sm text-[#4a6b4e]">
              If you got here by mistake, head back to sign in.
            </p>

            <div className="rounded-2xl border border-[#bae0bd] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 text-sm text-[#4a6b4e]">
                <p>
                  To reset your password, request a fresh link from the forgot password page.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/account/forgot-password"
                    className="rounded-xl bg-[#2d6a35] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
                  >
                    Request a reset link
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-[#bae0bd] bg-white px-4 py-3 text-center text-sm font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
