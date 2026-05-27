'use client'

import { useActionState, useEffect, useState } from 'react'
import { verifySwitcherPinAction } from '@/app/actions/pin'

type Student = { id: string; name: string }

type Props = {
  students: Student[]
  preselectStudentId: string
  next: string
  initialCooldownSeconds: number
}

export default function SwitcherUnlockForm({
  students,
  preselectStudentId,
  next,
  initialCooldownSeconds,
}: Props) {
  const [state, action, pending] = useActionState(verifySwitcherPinAction, null)
  const [secondsLeft, setSecondsLeft] = useState(initialCooldownSeconds)
  const [selected, setSelected] = useState(preselectStudentId)

  useEffect(() => {
    if (state && 'error' in state && state.error) {
      const match = state.error.match(/in (\d+)s/)
      if (match) {
        const secs = parseInt(match[1], 10)
        if (!Number.isNaN(secs) && secs > 0) setSecondsLeft(secs)
      }
    }
  }, [state])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const cooldownActive = secondsLeft > 0

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="student" value={selected} />

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[#4a6b4e]">
          Switch to
        </legend>
        <div className="flex flex-wrap gap-2">
          {students.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              disabled={cooldownActive}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                s.id === selected
                  ? 'bg-[#2d6a35] text-white'
                  : 'border border-[#bae0bd] bg-white text-[#2d6a35] hover:bg-[#f2faf3]'
              } disabled:opacity-60`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </fieldset>

      <label htmlFor="pin" className="text-xs font-medium text-[#4a6b4e] text-center">
        4-digit parent PIN
      </label>
      <input
        id="pin"
        name="pin"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{4}"
        maxLength={4}
        required
        autoFocus
        disabled={cooldownActive}
        placeholder="••••"
        className="mx-auto w-40 rounded-xl border border-[#bae0bd] bg-[#f7faf7] px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.5em] text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd] disabled:opacity-60"
      />

      {state && 'error' in state && state.error && (
        <p className="text-center text-sm text-[#4a6b4e]">{state.error}</p>
      )}

      {cooldownActive ? (
        <button
          type="button"
          disabled
          className="rounded-xl bg-[#e1f4e3] px-4 py-3.5 text-sm font-semibold text-[#2d6a35] opacity-80"
        >
          Take a short break — {secondsLeft}s
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#2d6a35] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
        >
          {pending ? 'Checking…' : 'Switch student'}
        </button>
      )}
    </form>
  )
}
