'use client'

import { useActionState } from 'react'
import { setWeeklyCcEmail } from '@/app/actions/reminders'

type Props = {
  currentCcEmail: string | null
}

export default function WeeklyCcEmailForm({ currentCcEmail }: Props) {
  const [state, action, pending] = useActionState(setWeeklyCcEmail, null)

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1a2e1c]">Weekly email copy</h3>
      <p className="mt-1 text-xs text-[#4a6b4e]">
        Send the Sunday weekly recap to one extra email, like another parent or caregiver.
        Only add someone who should receive this student&apos;s weekly progress recap.
      </p>

      {currentCcEmail && (
        <p className="mt-2 text-xs text-[#2d6a35]">
          Copying to: <span className="font-medium">{currentCcEmail}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={action} className="flex items-center gap-2">
          <input
            type="text"
            inputMode="email"
            name="cc_email"
            defaultValue={currentCcEmail ?? ''}
            placeholder="partner@example.com"
            autoComplete="email"
            disabled={pending}
            className="rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs text-[#1a2e1c] placeholder-[#9ab89e] focus:outline-none focus:ring-2 focus:ring-[#2d6a35]/30 disabled:opacity-50 w-52"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs font-semibold text-[#2d6a35] hover:bg-[#f2faf3] disabled:opacity-50 transition-colors"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </form>

        {currentCcEmail && (
          <form action={action}>
            <input type="hidden" name="cc_email" value="" />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs font-medium text-[#a85630] hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Remove
            </button>
          </form>
        )}
      </div>

      {state && 'error' in state && state.error && (
        <p className="mt-2 text-xs text-[#a85630]">{state.error}</p>
      )}
      {state && 'success' in state && state.success && (
        <p className="mt-2 text-xs font-medium text-[#2d6a35]">{state.success}</p>
      )}
    </div>
  )
}
