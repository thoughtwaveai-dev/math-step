'use client'

import { useActionState, useEffect, useState } from 'react'
import { submitWorksheet } from '@/app/actions/worksheet'
import type { AnyProblemType } from '@/lib/math/generators'
import { inputModeForType, placeholderForType, problemTypeLabel } from '@/lib/math/inputMode'
import { parseGraphPrompt } from '@/lib/math/graphPrompt'
import CoordinatePlane from '@/components/CoordinatePlane'
import EquationAnswerInput from './EquationAnswerInput'

interface PersistedProblem {
  id: string
  prompt: string
  type: AnyProblemType
  isReview?: boolean
}

interface Props {
  sessionId: string
  problems: PersistedProblem[]
  reviewProblemIds: string[]
}

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'] as const

export default function WorksheetForm({ sessionId, problems, reviewProblemIds }: Props) {
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
      <input type="hidden" name="review_problem_ids" value={reviewProblemIds.join(',')} />

      {/* Live timer */}
      <div className="flex items-center gap-3 rounded-xl border border-[#bae0bd] bg-white px-5 py-3.5">
        <span className="text-[#4a6b4e] text-xs font-medium uppercase tracking-wide">Timer</span>
        <span className="font-mono text-2xl font-bold text-[#1a2e1c]">{mm}:{ss}</span>
        <span className="ml-auto text-xs text-[#4a6b4e]">
          {elapsed === 0 ? 'Starting…' : 'In progress'}
        </span>
      </div>

      <p className="text-xs text-center text-[#4a6b4e]">
        Need space to work things out? There&apos;s a drawing area at the bottom of this page.
      </p>

      {/* Review explanation */}
      {reviewProblemIds.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          Review questions help keep earlier skills fresh while you practise your current level.
        </p>
      )}

      {/* Problems */}
      {problems.map((problem, index) => {
        const parsed = parseGraphPrompt(problem.prompt)
        return (
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                      {problemTypeLabel(problem.type)}
                    </span>
                    {problem.isReview && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Review
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-semibold text-[#1a2e1c] whitespace-pre-line">{parsed.displayText}</p>
                </div>

                {parsed.graph && (
                  <div className="flex justify-center">
                    <CoordinatePlane spec={parsed.graph} size="full" />
                  </div>
                )}

                {parsed.choices ? (
                  <fieldset>
                    <legend className="sr-only">Choose the matching graph</legend>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {parsed.choices.map((choiceSpec, choiceIdx) => {
                        const letter = CHOICE_LETTERS[choiceIdx]
                        const inputId = `${problem.id}_${letter}`
                        return (
                          <label
                            key={letter}
                            htmlFor={inputId}
                            className="cursor-pointer"
                          >
                            <input
                              id={inputId}
                              type="radio"
                              name={`answer_${problem.id}`}
                              value={letter}
                              className="peer sr-only"
                            />
                            <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-[#bae0bd] bg-white p-2 transition-colors peer-checked:border-[#2d6a35] peer-checked:bg-[#e1f4e3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2d6a35]">
                              <CoordinatePlane spec={choiceSpec} size="mini" />
                              <span className="text-sm font-bold text-[#1a2e1c]">{letter}</span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ) : problem.type === 'point_on_line' ? (
                  <fieldset>
                    <legend className="sr-only">Is the point on the line?</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {(['yes', 'no'] as const).map((value) => {
                        const inputId = `${problem.id}_${value}`
                        return (
                          <label key={value} htmlFor={inputId} className="cursor-pointer">
                            <input
                              id={inputId}
                              type="radio"
                              name={`answer_${problem.id}`}
                              value={value}
                              className="peer sr-only"
                            />
                            <div className="flex items-center justify-center rounded-lg border-2 border-[#bae0bd] bg-white px-4 py-3 text-base font-semibold text-[#1a2e1c] transition-colors peer-checked:border-[#2d6a35] peer-checked:bg-[#e1f4e3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2d6a35]">
                              {value === 'yes' ? 'Yes' : 'No'}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ) : problem.type === 'equation_from_slope_intercept' ? (
                  <EquationAnswerInput name={`answer_${problem.id}`} />
                ) : (
                  <input
                    type="text"
                    name={`answer_${problem.id}`}
                    placeholder={placeholderForType(problem.type)}
                    autoComplete="off"
                    inputMode={inputModeForType(problem.type)}
                    className="w-full rounded-lg border border-[#bae0bd] px-3.5 py-3 text-base text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]"
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}

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
