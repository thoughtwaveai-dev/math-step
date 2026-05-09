'use client'

import { useActionState } from 'react'
import { runPlacementDiagnostic, applyPlacement, type PlacementState } from '@/app/actions/placement'
import { PLACEMENT_QUESTIONS } from '@/lib/math/placement'

const BAND_LABELS: Record<string, string> = {
  arithmetic: 'Arithmetic',
  mul_div: 'Multiplication & Division',
  fractions: 'Fractions',
  decimals_pct: 'Decimals & Percentages',
  negatives_ops: 'Negative Numbers & Order of Operations',
  algebra: 'Algebra',
}

type Props = {
  studentId: string
  studentName: string
}

export default function PlacementForm({ studentId, studentName }: Props) {
  const [state, scoreAction, pending] = useActionState<PlacementState, FormData>(
    runPlacementDiagnostic,
    null
  )
  const [primaryApplyState, primaryApplyAction, primaryApplyPending] = useActionState<
    { error: string } | null,
    FormData
  >(applyPlacement, null)
  const [fallbackApplyState, fallbackApplyAction, fallbackApplyPending] = useActionState<
    { error: string } | null,
    FormData
  >(applyPlacement, null)
  const anyApplyPending = primaryApplyPending || fallbackApplyPending
  const applyError = primaryApplyState?.error || fallbackApplyState?.error

  if (state && 'step' in state && state.step === 'result') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e1f4e3] mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2e1c]">Placement complete</h1>
          <p className="mt-1 text-sm text-[#4a6b4e]">Nice work, {studentName}!</p>
        </div>

        <div className="rounded-2xl border-2 border-[#2d6a35] bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4a6b4e] mb-1">Score</p>
          <p className="text-3xl font-bold text-[#1a2e1c] mb-4">
            {state.score} <span className="text-[#4a6b4e]">/ {state.total}</span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4a6b4e] mb-1">Recommended starting point</p>
          <p className="text-4xl font-bold text-[#2d6a35]">
            Level {state.level}.{state.sublevel}
          </p>
          <p className="text-lg font-semibold text-[#1a2e1c] mt-1 mb-3">{state.topic}</p>
          <p className="text-sm text-[#4a6b4e]">
            This helps MathStep choose the best starting level — placement is about finding the right fit, not passing or failing.
          </p>
          <p className="mt-2 text-sm text-[#4a6b4e]">{state.explanation}</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#1a2e1c]">Review your answers</h2>
          {state.questions.map((q, i) => (
            <div
              key={q.id}
              className={`rounded-xl border bg-white p-4 ${
                q.isCorrect ? 'border-[#bae0bd]' : 'border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    q.isCorrect
                      ? 'bg-[#e1f4e3] text-[#2d6a35]'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {q.isCorrect ? '✓' : '✕'}
                </span>

                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-[#4a6b4e]">Question {i + 1}</p>
                  <p className="text-base font-semibold text-[#1a2e1c]">{q.prompt}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                        Your answer
                      </p>
                      <p
                        className={`mt-0.5 font-semibold ${
                          q.isCorrect ? 'text-[#2d6a35]' : 'text-amber-700'
                        }`}
                      >
                        {q.studentAnswer || (
                          <span className="italic text-[#a0b8a3]">no answer</span>
                        )}
                      </p>
                    </div>

                    {!q.isCorrect && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">
                          Correct answer
                        </p>
                        <p className="mt-0.5 font-semibold text-[#2d6a35]">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  <p
                    className={`text-xs font-semibold ${
                      q.isCorrect ? 'text-[#2d6a35]' : 'text-amber-700'
                    }`}
                  >
                    {q.isCorrect ? 'Correct ✓' : 'Needs practice'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {applyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {applyError}
            </div>
          )}

          <form action={primaryApplyAction}>
            <input type="hidden" name="student_id" value={studentId} />
            <input type="hidden" name="level" value={state.level} />
            <input type="hidden" name="sublevel" value={state.sublevel} />
            <button
              type="submit"
              disabled={anyApplyPending}
              className="w-full rounded-xl bg-[#2d6a35] px-4 py-4 text-base font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
            >
              {primaryApplyPending
                ? 'Starting…'
                : `Start practising at Level ${state.level}.${state.sublevel}`}
            </button>
          </form>

          <form action={fallbackApplyAction}>
            <input type="hidden" name="student_id" value={studentId} />
            <input type="hidden" name="level" value="1" />
            <input type="hidden" name="sublevel" value="1" />
            <button
              type="submit"
              disabled={anyApplyPending}
              className="w-full rounded-xl border border-[#bae0bd] bg-white px-4 py-3.5 text-sm font-medium text-[#4a6b4e] hover:bg-[#f2faf3] disabled:opacity-50 transition-colors"
            >
              {fallbackApplyPending ? 'Starting…' : 'Start at Level 1.1 instead'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  let lastBand = ''
  const questionGroups: React.ReactNode[] = []

  PLACEMENT_QUESTIONS.forEach((q, i) => {
    const bandLabel = BAND_LABELS[q.band]
    if (q.band !== lastBand) {
      lastBand = q.band
      questionGroups.push(
        <p key={`band-${q.band}`} className="text-xs font-semibold uppercase tracking-widest text-[#4a6b4e] mt-6 mb-2 first:mt-0">
          {bandLabel}
        </p>
      )
    }

    questionGroups.push(
      <div key={q.id} className="rounded-xl border border-[#bae0bd] bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#e1f4e3] text-xs font-bold text-[#2d6a35]">
            {q.id}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1a2e1c] mb-2">{q.prompt}</p>
            {q.hint && (
              <p className="text-xs text-[#4a6b4e] mb-2">Format: {q.hint}</p>
            )}
            <input
              name={`answer_${i}`}
              type="text"
              inputMode={q.inputMode}
              placeholder="Your answer"
              className="w-full rounded-lg border border-[#bae0bd] px-3 py-2 text-sm text-[#1a2e1c] outline-none placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:ring-2 focus:ring-[#bae0bd]"
            />
          </div>
        </div>
      </div>
    )
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e1c]">
          Placement Quiz for {studentName}
        </h1>
        <p className="mt-1 text-sm text-[#4a6b4e]">
          12 quick questions to find the right starting level. No timer — just do your best.
        </p>
      </div>

      {state && 'error' in state && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={scoreAction} className="space-y-2">
        <input type="hidden" name="student_id" value={studentId} />

        {questionGroups}

        <div className="pt-4">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#2d6a35] px-4 py-4 text-base font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-50 transition-colors"
          >
            {pending ? 'Scoring…' : 'See my recommended level →'}
          </button>
        </div>
      </form>
    </div>
  )
}
