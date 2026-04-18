'use client'

import { useActionState } from 'react'
import { createStudent } from '@/app/actions/students'

export default function OnboardingForm() {
  const [state, action, pending] = useActionState(createStudent, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#1a2e1c]">
          Student name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Alex"
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
        name="start_mode"
        value="default"
        disabled={pending}
        className="rounded-xl bg-[#2d6a35] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
      >
        {pending ? 'Setting up…' : 'Start at Level 1'}
      </button>

      <button
        type="submit"
        name="start_mode"
        value="diagnostic"
        disabled={pending}
        className="rounded-xl border border-[#bae0bd] bg-white px-4 py-3.5 text-sm font-semibold text-[#2d6a35] hover:bg-[#f2faf3] disabled:opacity-50 transition-colors"
      >
        {pending ? 'Setting up…' : 'Take a short placement quiz →'}
      </button>
    </form>
  )
}
