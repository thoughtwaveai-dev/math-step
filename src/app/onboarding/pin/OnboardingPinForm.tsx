'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setPin } from '@/app/actions/pin'

type Props = {
  skipHref: string
}

export default function OnboardingPinForm({ skipHref }: Props) {
  const [state, action, pending] = useActionState(setPin, null)
  const router = useRouter()

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      router.push(skipHref)
    }
  }, [state, router, skipHref])

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="block">
        <span className="text-xs font-medium text-[#1a2e1c]">4-digit PIN</span>
        <input
          name="new_pin"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          autoComplete="off"
          autoFocus
          placeholder="••••"
          className="mt-1 w-full rounded-lg border border-[#bae0bd] bg-[#f7faf7] px-3.5 py-3 text-center text-lg font-semibold tracking-[0.5em] text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[#1a2e1c]">Confirm PIN</span>
        <input
          name="confirm_pin"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          autoComplete="off"
          placeholder="••••"
          className="mt-1 w-full rounded-lg border border-[#bae0bd] bg-[#f7faf7] px-3.5 py-3 text-center text-lg font-semibold tracking-[0.5em] text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]"
        />
      </label>

      {state && 'error' in state && state.error && (
        <p className="text-sm text-[#a85630]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2d6a35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
      >
        {pending ? 'Saving…' : 'Save PIN and continue'}
      </button>
    </form>
  )
}
