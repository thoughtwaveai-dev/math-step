'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { lockToStudentMode, setPin } from '@/app/actions/pin'

type Props = {
  hasPin: boolean
  studentCount?: number
}

export default function StudentModeCard({ hasPin, studentCount = 1 }: Props) {
  const [setState, setAction, setPending] = useActionState(setPin, null)
  const [showSetupForm, setShowSetupForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (setState && 'success' in setState && setState.success) {
      setShowSetupForm(false)
      router.refresh()
    }
  }, [setState, router])

  if (hasPin) {
    return (
      <div className="rounded-xl border border-[#bae0bd] bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base">🛡️</span>
            <h2 className="text-base font-semibold text-[#1a2e1c]">Student Mode ready</h2>
          </div>
          <p className="mt-1 text-sm text-[#4a6b4e]">
            Parent View is protected when you hand the device over.
          </p>
        </div>
        <form action={lockToStudentMode} className="mt-4 sm:mt-0 sm:shrink-0">
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2d6a35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors sm:w-auto"
          >
            Hand over to child
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5 shadow-sm">
      <div className="sm:flex sm:items-start sm:justify-between sm:gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base">🔐</span>
            <h2 className="text-base font-semibold text-[#1a2e1c]">Parent PIN</h2>
          </div>
          <p className="mt-1 text-sm text-[#4a6b4e]">
            Add a quick 4-digit PIN so your child can practise in Student View without opening Parent View.
          </p>
          {studentCount > 1 && (
            <p className="mt-2 text-sm text-[#4a6b4e]">
              With more than one child on this account, the PIN also locks the student switcher in Student View — so each child stays on their own workbook.
            </p>
          )}
        </div>
        {!showSetupForm && (
          <div className="mt-4 sm:mt-0 sm:shrink-0">
            <button
              type="button"
              onClick={() => setShowSetupForm(true)}
              className="w-full rounded-xl bg-[#2d6a35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors sm:w-auto"
            >
              Set up PIN
            </button>
          </div>
        )}
      </div>

      {showSetupForm && (
        <form action={setAction} className="mt-4 space-y-3 rounded-lg border border-[#e8f5e9] bg-[#f7faf7] p-4">
          <label className="block">
            <span className="text-xs font-medium text-[#1a2e1c]">New 4-digit PIN</span>
            <input
              name="new_pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-[#bae0bd] bg-white px-3 py-2 text-sm tracking-widest text-[#1a2e1c] focus:border-[#2d6a35] focus:outline-none focus:ring-1 focus:ring-[#2d6a35]"
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
              className="mt-1 w-full rounded-lg border border-[#bae0bd] bg-white px-3 py-2 text-sm tracking-widest text-[#1a2e1c] focus:border-[#2d6a35] focus:outline-none focus:ring-1 focus:ring-[#2d6a35]"
            />
          </label>
          {setState && 'error' in setState && setState.error && (
            <p className="text-xs text-[#a85630]">{setState.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={setPending}
              className="rounded-lg bg-[#2d6a35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
            >
              {setPending ? 'Saving…' : 'Save PIN'}
            </button>
            <button
              type="button"
              onClick={() => setShowSetupForm(false)}
              className="rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
