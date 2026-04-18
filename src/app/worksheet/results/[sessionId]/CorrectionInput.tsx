'use client'

import { useActionState } from 'react'
import { submitSelfCorrection } from '@/app/actions/selfCorrection'

interface Props {
  problemId: string
  sessionId: string
  correctAnswer: string
}

const initialState = { error: '', correct: false }

export default function CorrectionInput({ problemId, sessionId, correctAnswer }: Props) {
  const [state, action, pending] = useActionState(submitSelfCorrection, initialState)

  // If the correction was just accepted, show success badge (page will revalidate shortly)
  if (state.correct) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#2d6a35] px-2.5 py-0.5 text-xs font-semibold text-white">
        ✓ Corrected
      </span>
    )
  }

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="problem_id" value={problemId} />
      <input type="hidden" name="session_id" value={sessionId} />
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="correction_answer"
          placeholder={`Correct answer for: ${correctAnswer.includes('<') || correctAnswer.includes('>') ? 'e.g. x > 3' : 'number'}`}
          autoComplete="off"
          className="w-36 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-[#1a2e1c] placeholder:text-[#a0b8a3] focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {pending ? '…' : 'Check'}
        </button>
      </div>
      {state.error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{state.error}</p>
      )}
    </form>
  )
}
