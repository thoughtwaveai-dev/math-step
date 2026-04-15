'use client'

import { useActionState, useEffect, useState } from 'react'
import { submitWorksheet } from '@/app/actions/worksheet'
import type { AnyProblemType } from '@/lib/math/generators'

interface PersistedProblem {
  id: string
  prompt: string
  type: AnyProblemType
}

interface Props {
  sessionId: string
  problems: PersistedProblem[]
}

function problemTypeLabel(type: AnyProblemType): string {
  switch (type) {
    case 'addition': return 'Addition'
    case 'subtraction': return 'Subtraction'
    case 'multiplication': return 'Multiplication'
    case 'prime_factorization': return 'Prime Factorization'
    case 'list_factors': return 'List Factors'
    case 'gcf': return 'Greatest Common Factor'
    case 'lcm': return 'Least Common Multiple'
  }
}

export default function WorksheetForm({ sessionId, problems }: Props) {
  const [state, formAction, pending] = useActionState(submitWorksheet, null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="time_taken_seconds" value={elapsed} />

      {/* Live timer */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-3">
        <span className="text-zinc-400 text-sm font-medium uppercase tracking-wide">Timer</span>
        <span className="font-mono text-xl font-semibold text-zinc-900">{mm}:{ss}</span>
        <span className="ml-auto text-xs text-zinc-400">
          {elapsed === 0 ? 'Starting…' : 'In progress'}
        </span>
      </div>

      {/* Problems */}
      {problems.map((problem, index) => (
        <div
          key={problem.id}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
              {index + 1}
            </span>
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {problemTypeLabel(problem.type)}
                </span>
                <p className="mt-1 text-base font-medium text-zinc-900">{problem.prompt}</p>
              </div>
              <input
                type="text"
                name={`answer_${problem.id}`}
                placeholder="Your answer"
                autoComplete="off"
                disabled={pending}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      ))}

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Submitting…' : 'Submit Worksheet'}
      </button>
    </form>
  )
}
