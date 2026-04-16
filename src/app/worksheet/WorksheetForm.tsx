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
    case 'factor_pairs': return 'Factor Pairs'
    case 'common_factors': return 'Common Factors'
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
      <div className="flex items-center gap-3 rounded-xl border border-[#bae0bd] bg-white px-5 py-3.5">
        <span className="text-[#4a6b4e] text-xs font-medium uppercase tracking-wide">Timer</span>
        <span className="font-mono text-2xl font-bold text-[#1a2e1c]">{mm}:{ss}</span>
        <span className="ml-auto text-xs text-[#4a6b4e]">
          {elapsed === 0 ? 'Starting…' : 'In progress'}
        </span>
      </div>

      {/* Problems */}
      {problems.map((problem, index) => (
        <div
          key={problem.id}
          className="rounded-xl border border-[#bae0bd] bg-white p-5"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e1f4e3] text-sm font-bold text-[#2d6a35]">
              {index + 1}
            </span>
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                  {problemTypeLabel(problem.type)}
                </span>
                <p className="mt-1 text-lg font-semibold text-[#1a2e1c]">{problem.prompt}</p>
              </div>
              <input
                type="text"
                name={`answer_${problem.id}`}
                placeholder="Your answer"
                autoComplete="off"
                inputMode="numeric"
                disabled={pending}
                className="w-full rounded-lg border border-[#bae0bd] px-3.5 py-3 text-base text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd] disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      ))}

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#2d6a35] px-6 py-4 text-base font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Submitting…' : 'Submit Worksheet'}
      </button>
    </form>
  )
}
