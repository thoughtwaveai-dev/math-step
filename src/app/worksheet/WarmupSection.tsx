'use client'

import { useState } from 'react'
import { gradeAnswer } from '@/lib/math/gradeAnswer'

interface WarmupProblem {
  prompt: string
  answer: string
  type: string
}

interface Props {
  problems: WarmupProblem[]
  warmupTopicLabel: string
}

export default function WarmupSection({ problems, warmupTopicLabel }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="rounded-xl border border-[#bae0bd] bg-[#e1f4e3] px-5 py-4">
        <p className="text-sm font-semibold text-[#1a2e1c]">Warm-up complete — nice work!</p>
        <p className="mt-0.5 text-xs text-[#4a6b4e]">You&apos;re ready for the full worksheet below.</p>
      </div>
    )
  }

  const results = checked
    ? problems.map((p, i) => gradeAnswer(answers[i] ?? '', p.answer))
    : null

  const allCorrect = results?.every(Boolean)

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-blue-900">Warm-up: {warmupTopicLabel}</p>
        <p className="mt-0.5 text-xs text-blue-700">
          Try these easier problems first to build confidence. This doesn&apos;t count toward your score.
        </p>
      </div>

      <div className="space-y-3">
        {problems.map((p, i) => {
          const isCorrect = results?.[i]
          return (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-blue-900 min-w-[120px]">{p.prompt}</span>
              <input
                type="text"
                value={answers[i] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                disabled={checked}
                placeholder="answer"
                className={`w-28 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors ${
                  checked
                    ? isCorrect
                      ? 'border-[#bae0bd] bg-[#e1f4e3] text-[#1a2e1c]'
                      : 'border-red-300 bg-red-50 text-red-900'
                    : 'border-blue-200 bg-white text-[#1a2e1c] focus:border-blue-400'
                }`}
              />
              {checked && (
                <span className={`text-xs font-semibold ${isCorrect ? 'text-[#2d6a35]' : 'text-red-600'}`}>
                  {isCorrect ? '✓' : `✗ ${p.answer}`}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Check answers
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          {allCorrect ? (
            <p className="text-sm font-semibold text-[#2d6a35]">Great — all correct!</p>
          ) : (
            <p className="text-sm text-blue-800">
              Review the ones marked with ✗, then continue to the worksheet.
            </p>
          )}
          <button
            onClick={() => setDone(true)}
            className="rounded-lg bg-[#2d6a35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors"
          >
            Continue to worksheet →
          </button>
        </div>
      )}
    </div>
  )
}
