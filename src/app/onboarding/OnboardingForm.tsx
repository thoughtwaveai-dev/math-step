'use client'

import { useActionState, useMemo, useState } from 'react'
import { createStudent } from '@/app/actions/students'

type ExistingStudent = { id: string; name: string }

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = new Array<number>(n + 1)
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

function isSimilar(typed: string, existing: string): boolean {
  if (typed.length < 4 || existing.length < 4) return false
  if (levenshtein(typed, existing) <= 1) return true
  const longer = typed.length >= existing.length ? typed : existing
  const shorter = typed.length >= existing.length ? existing : typed
  if (longer.startsWith(shorter) && longer.length - shorter.length <= 2) return true
  return false
}

export default function OnboardingForm({
  existingStudents,
}: {
  existingStudents: ExistingStudent[]
}) {
  const [state, action, pending] = useActionState(createStudent, null)
  const [name, setName] = useState('')
  const [confirmedNormalized, setConfirmedNormalized] = useState<string | null>(null)

  const normalized = name.trim().toLowerCase()

  const exactMatch = useMemo(() => {
    if (!normalized) return null
    return (
      existingStudents.find(s => s.name.trim().toLowerCase() === normalized) ??
      null
    )
  }, [normalized, existingStudents])

  const similarMatch = useMemo(() => {
    if (!normalized || exactMatch) return null
    return (
      existingStudents.find(s =>
        isSimilar(normalized, s.name.trim().toLowerCase())
      ) ?? null
    )
  }, [normalized, exactMatch, existingStudents])

  const similarConfirmed =
    confirmedNormalized !== null && confirmedNormalized === normalized

  const blocked =
    exactMatch !== null || (similarMatch !== null && !similarConfirmed)
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

      {exactMatch && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <p className="mb-2">You already have a student named {exactMatch.name}.</p>
          <a
            href={`/dashboard?student=${exactMatch.id}`}
            className="inline-block rounded-lg bg-[#2d6a35] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Go to {exactMatch.name}&apos;s dashboard →
          </a>
        </div>
      )}

      {!exactMatch && similarMatch && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <p className="mb-2">
            This looks similar to {similarMatch.name}. Is this a new student?
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/dashboard?student=${similarMatch.id}`}
              className="inline-block rounded-lg bg-[#2d6a35] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f4d26] transition-colors"
            >
              Go to {similarMatch.name}&apos;s dashboard
            </a>
            <button
              type="button"
              onClick={() => setConfirmedNormalized(normalized)}
              disabled={similarConfirmed}
              className="inline-block rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {similarConfirmed ? 'Confirmed — new student' : 'Yes, add as new student'}
            </button>
          </div>
        </div>
      )}

      {state?.error && !exactMatch && !similarMatch && (
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
