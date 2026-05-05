'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setPin, removePin } from '@/app/actions/pin'

type Props = {
  hasPin: boolean
}

export default function PinSettings({ hasPin }: Props) {
  const [setState, setAction, setPending] = useActionState(setPin, null)
  const [removeState, removeAction, removePending] = useActionState(removePin, null)
  const [showSetForm, setShowSetForm] = useState(false)
  const [showRemoveForm, setShowRemoveForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (setState && 'success' in setState && setState.success) {
      setShowSetForm(false)
      router.refresh()
    }
  }, [setState, router])

  useEffect(() => {
    if (removeState && 'success' in removeState && removeState.success) {
      setShowRemoveForm(false)
      router.refresh()
    }
  }, [removeState, router])

  if (!hasPin) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1a2e1c]">Manage Parent PIN</h3>
      <p className="mt-1 text-xs text-[#4a6b4e]">
        Change or remove the 4-digit PIN. The Parent PIN card above is the main entry point.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f4e3] px-3 py-1 text-xs font-semibold text-[#2d6a35]">
          PIN saved
        </span>
        {!showSetForm && !showRemoveForm && (
          <>
            <button
              type="button"
              onClick={() => setShowSetForm(true)}
              className="rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              Change PIN
            </button>
            <button
              type="button"
              onClick={() => setShowRemoveForm(true)}
              className="rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
            >
              Remove PIN
            </button>
          </>
        )}
      </div>

      {showSetForm && (
        <form action={setAction} className="mt-4 space-y-3 rounded-lg border border-[#e8f5e9] bg-[#f7faf7] p-4">
          <label className="block">
            <span className="text-xs font-medium text-[#1a2e1c]">Current PIN</span>
            <input
              name="current_pin"
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
            <span className="text-xs font-medium text-[#1a2e1c]">New PIN</span>
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
          {setState && 'success' in setState && setState.success && (
            <p className="text-xs font-medium text-[#2d6a35]">{setState.success}</p>
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
              onClick={() => setShowSetForm(false)}
              className="rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showRemoveForm && (
        <form action={removeAction} className="mt-4 space-y-3 rounded-lg border border-[#e8f5e9] bg-[#f7faf7] p-4">
          <p className="text-xs text-[#4a6b4e]">
            Removing the PIN means the parent dashboard will be reachable without it.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-[#1a2e1c]">Current PIN</span>
            <input
              name="current_pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-[#bae0bd] bg-white px-3 py-2 text-sm tracking-widest text-[#1a2e1c] focus:border-[#2d6a35] focus:outline-none focus:ring-1 focus:ring-[#2d6a35]"
            />
          </label>
          {removeState && 'error' in removeState && removeState.error && (
            <p className="text-xs text-[#a85630]">{removeState.error}</p>
          )}
          {removeState && 'success' in removeState && removeState.success && (
            <p className="text-xs font-medium text-[#2d6a35]">{removeState.success}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={removePending}
              className="rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-xs font-semibold text-[#2d6a35] hover:bg-[#f2faf3] disabled:opacity-50 transition-colors"
            >
              {removePending ? 'Removing…' : 'Remove PIN'}
            </button>
            <button
              type="button"
              onClick={() => setShowRemoveForm(false)}
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
