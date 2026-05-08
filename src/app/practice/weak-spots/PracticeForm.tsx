'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { AnyProblemType } from '@/lib/math/generators'
import { gradeAnswer } from '@/lib/math/gradeAnswer'
import { inputModeForType, problemTypeLabel } from '@/lib/math/inputMode'
import { recordPracticeSession } from '@/app/actions/practiceSessions'

interface PracticeProblem {
  id: string
  prompt: string
  answer: string
  type: AnyProblemType
}

interface Props {
  problems: PracticeProblem[]
  studentId: string
  levelId: number | null
  problemType: string | null
}

interface GradedProblem {
  problem: PracticeProblem
  studentAnswer: string
  isCorrect: boolean
}

export default function PracticeForm({ problems, studentId, levelId, problemType }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [graded, setGraded] = useState<GradedProblem[] | null>(null)

  const summary = useMemo(() => {
    if (!graded) return null
    const correct = graded.filter(g => g.isCorrect).length
    const total = graded.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return { correct, total, pct }
  }, [graded])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const results: GradedProblem[] = problems.map(p => {
      const studentAnswer = (answers[p.id] ?? '').trim()
      return {
        problem: p,
        studentAnswer,
        isCorrect: studentAnswer ? gradeAnswer(studentAnswer, p.answer) : false,
      }
    })
    setGraded(results)

    // Fire-and-forget persistence. Failure must never block the results screen.
    if (levelId !== null) {
      const total = results.length
      const correct = results.filter(r => r.isCorrect).length
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
      recordPracticeSession({
        studentId,
        levelId,
        problemType,
        totalProblems: total,
        correctCount: correct,
        accuracy,
      }).catch(() => {})
    }

    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (graded && summary) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-6 ${
            summary.pct >= 80 ? 'border-[#bae0bd] bg-[#e1f4e3]' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4a6b4e]">
            Practice complete
          </p>
          <p className="mt-1 text-3xl font-bold text-[#1a2e1c] tabular-nums">
            {summary.correct} / {summary.total} ({summary.pct}%)
          </p>
          <p className="mt-1 text-xs text-[#4a6b4e]">
            Nice work — this was practice only, so nothing changes in your stats.
          </p>
        </div>

        <div className="space-y-3">
          {graded.map((g, i) => (
            <div
              key={g.problem.id}
              className={`rounded-xl border bg-white p-5 ${
                g.isCorrect ? 'border-[#bae0bd]' : 'border-red-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    g.isCorrect ? 'bg-[#e1f4e3] text-[#2d6a35]' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {g.isCorrect ? '✓' : '✗'}
                </span>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-[#4a6b4e]">Problem {i + 1}</p>
                  <p className="text-base font-semibold text-[#1a2e1c]">{g.problem.prompt}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Your answer</p>
                      <p className={`mt-0.5 font-semibold ${g.isCorrect ? 'text-[#2d6a35]' : 'text-red-600'}`}>
                        {g.studentAnswer || <span className="italic text-[#a0b8a3]">no answer</span>}
                      </p>
                    </div>
                    {!g.isCorrect && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#4a6b4e]">Correct answer</p>
                        <p className="mt-0.5 font-semibold text-[#2d6a35]">{g.problem.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setGraded(null)
              setAnswers({})
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className="flex-1 rounded-xl bg-[#2d6a35] px-6 py-4 text-center text-base font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Practise again
          </button>
          <Link
            href={`/play?student=${studentId}`}
            className="flex-1 rounded-xl border-2 border-[#bae0bd] bg-white px-6 py-4 text-center text-base font-semibold text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            Back to play
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {problems.map((problem, index) => (
        <div key={problem.id} className="rounded-xl border border-[#bae0bd] bg-white p-5">
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
                value={answers[problem.id] ?? ''}
                onChange={(e) => setAnswers(a => ({ ...a, [problem.id]: e.target.value }))}
                placeholder="Your answer"
                autoComplete="off"
                inputMode={inputModeForType(problem.type)}
                className="w-full rounded-lg border border-[#bae0bd] px-3.5 py-3 text-base text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="submit"
        className="w-full rounded-xl bg-[#2d6a35] px-6 py-4 text-base font-semibold text-white hover:bg-[#1f4d26] transition-colors"
      >
        Check answers
      </button>
    </form>
  )
}
