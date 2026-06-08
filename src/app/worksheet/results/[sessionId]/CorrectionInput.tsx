'use client'

import { useActionState } from 'react'
import type { AnyProblemType } from '@/lib/math/generators'
import { getAnswerControlType } from '@/lib/math/answerControl'
import { submitSelfCorrection } from '@/app/actions/selfCorrection'
import AnswerInput from '@/components/answer-controls/AnswerInput'

interface Props {
  problemId: string
  sessionId: string
  correctAnswer: string
  // Generator type for this problem. May be null for legacy rows → plain text fallback.
  problemType: AnyProblemType | null
}

const initialState = { error: '', correct: false }

export default function CorrectionInput({ problemId, sessionId, correctAnswer, problemType }: Props) {
  const [state, action, pending] = useActionState(submitSelfCorrection, initialState)

  // If the correction was just accepted, show success badge (page will revalidate shortly)
  if (state.correct) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#2d6a35] px-2.5 py-0.5 text-xs font-semibold text-white">
        ✓ Corrected
      </span>
    )
  }

  // Use a structured control when the type calls for one; otherwise the existing inline
  // text input with the smart placeholder. submitSelfCorrection still reads
  // "correction_answer" from the form either way.
  const control = problemType ? getAnswerControlType(problemType) : 'default'
  const isStructured = control !== 'default'

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="problem_id" value={problemId} />
      <input type="hidden" name="session_id" value={sessionId} />
      {isStructured && problemType ? (
        <div className="space-y-3">
          <AnswerInput name="correction_answer" type={problemType} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Checking…' : 'Check'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            name="correction_answer"
            placeholder={
              (correctAnswer.includes('<') || correctAnswer.includes('>'))
                ? 'e.g. x > 3'
                : (correctAnswer.includes('=') && correctAnswer.includes(','))
                  ? 'e.g. x = 3, y = 7'
                  : /[a-zA-Z]/.test(correctAnswer)
                    ? 'e.g. 5x + 2'
                    : 'your answer'
            }
            autoComplete="off"
            className={`${
              correctAnswer.includes('=') && correctAnswer.includes(',') ? 'w-48' : 'w-36'
            } rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-[#1a2e1c] placeholder:text-[#a0b8a3] focus:border-amber-500 focus:outline-none`}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {pending ? '…' : 'Check'}
          </button>
        </div>
      )}
      {state.error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{state.error}</p>
      )}
    </form>
  )
}
