'use client'

import { useActionState, useMemo, useState } from 'react'
import { createStudent } from '@/app/actions/students'

type ExistingStudent = { id: string; name: string }

export default function OnboardingForm({
  existingStudents,
}: {
  existingStudents: ExistingStudent[]
}) {
  const [state, action, pending] = useActionState(createStudent, null)
  const [name, setName] = useState('')

  const duplicate = useMemo(() => {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return null
    return (
      existingStudents.find(s => s.name.trim().toLowerCase() === normalized) ??
      null
    )
  }, [name, existingStudents])

  const blocked = duplicate !== null
  const buttonsDisabled = pending || blocked

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
          value={name}
          onChange={e => setName(e.target.value)}
          aria-invalid={blocked || undefined}
          className="rounded-lg border border-[#bae0bd] px-3.5 py-3 text-sm text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd]"
        />
      </div>

      {duplicate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <p className="mb-2">You already have a student named {duplicate.name}.</p>
          <a
            href={`/dashboard?student=${duplicate.id}`}
            className="inline-block rounded-lg bg-[#2d6a35] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Go to {duplicate.name}&apos;s dashboard →
          </a>
        </div>
      )}

      {state?.error && !duplicate && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <button
          type="submit"
          name="start_mode"
          value="default"
          disabled={buttonsDisabled}
          className="rounded-xl bg-[#2d6a35] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Setting up…' : 'Start at Level 1'}
        </button>
        <p className="text-xs text-[#4a6b4e] text-center">
          Starts from the beginning. Great for younger students or building a solid foundation.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="submit"
          name="start_mode"
          value="diagnostic"
          disabled={buttonsDisabled}
          className="rounded-xl border border-[#bae0bd] bg-white px-4 py-3.5 text-sm font-semibold text-[#2d6a35] hover:bg-[#f2faf3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Setting up…' : 'Take a short placement quiz →'}
        </button>
        <p className="text-xs text-[#4a6b4e] text-center">
          Answer a few questions to find the right starting level. Takes about 2 minutes.
        </p>
      </div>
    </form>
  )
}
